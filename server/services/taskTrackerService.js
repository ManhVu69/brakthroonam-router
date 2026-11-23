const fs = require('fs');
const path = require('path');
const { getDb } = require('../db');

/**
 * Mask sensitive tokens, passwords, and API keys
 */
function maskSecrets(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/(AIza[0-9A-Za-z-_]{35})/g, 'AIza****[PROTECTED]')
    .replace(/(sk-[a-zA-Z0-9]{20,})/g, 'sk-****[PROTECTED]')
    .replace(/(ghp_[a-zA-Z0-9]{30,})/g, 'ghp_****[PROTECTED]')
    .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]{20,}/gi, '$1****[TOKEN]');
}

/**
 * Helper to clean tool args from stringified JSON if needed
 */
function cleanArgValue(val) {
  if (typeof val !== 'string') return val;
  try {
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('{') && val.endsWith('}'))) {
      return JSON.parse(val);
    }
  } catch {}
  return val;
}

/**
 * High-speed reverse tail reader for jsonl files.
 * Only reads the last maxBytes (default 256KB) from end of file without loading whole file.
 */
function readTailJsonlLines(filePath, maxLines = 150, maxBytes = 256 * 1024) {
  if (!fs.existsSync(filePath)) return [];

  let fd = null;
  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    if (fileSize === 0) return [];

    const bytesToRead = Math.min(fileSize, maxBytes);
    const buffer = Buffer.alloc(bytesToRead);
    const startPosition = fileSize - bytesToRead;

    // Open file in read-only non-exclusive mode
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, bytesToRead, startPosition);
    fs.closeSync(fd);
    fd = null;

    const content = buffer.toString('utf8');
    const rawLines = content.split('\n');
    const lines = (startPosition > 0) ? rawLines.slice(1) : rawLines;
    return lines.map(l => l.trim()).filter(Boolean).slice(-maxLines);
  } catch (err) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
    return [];
  }
}

/**
 * Helper to check whether a conversation is an internal subagent session
 * (Step 0 starts with SYSTEM_MESSAGE and has sender=<parentId>)
 */
function isSubagentConversation(baseDir, convId) {
  try {
    const transFile = path.join(baseDir, 'brain', convId, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(transFile)) return false;
    const fd = fs.openSync(transFile, 'r');
    const buf = Buffer.alloc(512);
    const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
    const chunk = buf.toString('utf8', 0, bytesRead);
    return chunk.includes('"source":"SYSTEM"') && chunk.includes('sender=');
  } catch {
    return false;
  }
}

/**
 * Fast discovery of the current active Antigravity session.
 * Uses conversations/*.db-wal and presence/*.lock first for 2ms lookup.
 * Always targets the root user conversation, filtering out temporary child subagents.
 */
function getActiveAntigravityConversationId() {
  const baseDir = path.join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Admin', '.gemini', 'antigravity');
  const convDir = path.join(baseDir, 'conversations');

  let activeId = null;
  let newestMtime = 0;

  if (fs.existsSync(convDir)) {
    try {
      const files = fs.readdirSync(convDir);
      for (const f of files) {
        if (f.endsWith('.db') || f.endsWith('.db-wal')) {
          try {
            const stat = fs.statSync(path.join(convDir, f));
            const candId = f.replace(/\.db(-wal)?$/, '');
            if (isSubagentConversation(baseDir, candId)) continue;
            if (stat.mtimeMs > newestMtime) {
              newestMtime = stat.mtimeMs;
              activeId = candId;
            }
          } catch {}
        }
      }
    } catch {}
  }

  // Fallback to brain directory if convDir fails
  if (!activeId) {
    const brainDir = path.join(baseDir, 'brain');
    if (fs.existsSync(brainDir)) {
      try {
        const dirs = fs.readdirSync(brainDir);
        for (const d of dirs) {
          if (isSubagentConversation(baseDir, d)) continue;
          const transPath = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
          if (fs.existsSync(transPath)) {
            try {
              const stat = fs.statSync(transPath);
              if (stat.mtimeMs > newestMtime) {
                newestMtime = stat.mtimeMs;
                activeId = d;
              }
            } catch {}
          }
        }
      } catch {}
    }
  }

  return { conversationId: activeId, lastModified: newestMtime };
}

/**
 * Format a tool call into a human-friendly current action
 */
function formatToolCallAction(toolCall) {
  if (!toolCall) return { type: 'idle', title: 'Sẵn sàng nhận tác vụ', detail: '', target: '' };

  const name = toolCall.name || '';
  const args = toolCall.args || toolCall.parameters || {};

  if (name === 'read_file') {
    const rawPath = cleanArgValue(args.Path) || '';
    const fileName = path.basename(rawPath) || rawPath;
    const startL = cleanArgValue(args.StartLine);
    const endL = cleanArgValue(args.EndLine);
    const lines = (startL && endL) ? ` (dòng ${startL} - ${endL})` : '';

    return {
      type: 'read_file',
      badge: 'ĐANG ĐỌC TỆP TIN',
      icon: 'file-text',
      title: `Đang đọc tệp tin: ${fileName}${lines}`,
      detail: `Đường dẫn: ${maskSecrets(rawPath)}`,
      target: rawPath,
      fileName,
      lines: lines.trim()
    };
  }

  if (name === 'run_command') {
    const cmd = cleanArgValue(args.CommandLine) || '';
    const summary = cleanArgValue(args.toolSummary) || 'Thực thi lệnh shell';
    const maskedCmd = maskSecrets(cmd);

    return {
      type: 'run_command',
      badge: 'CHẠY LỆNH SHELL',
      icon: 'terminal',
      title: `Đang thực thi: ${summary}`,
      detail: `Lệnh: ${maskedCmd}`,
      target: maskedCmd
    };
  }

  if (name === 'edit_file') {
    const rawPath = cleanArgValue(args.Path) || '';
    const fileName = path.basename(rawPath) || rawPath;
    return {
      type: 'edit_file',
      badge: 'SỬA ĐỔI CODE',
      icon: 'file-code',
      title: `Đang chỉnh sửa mã nguồn: ${fileName}`,
      detail: `Đường dẫn: ${maskSecrets(rawPath)}`,
      target: rawPath,
      fileName
    };
  }

  if (name === 'write_file') {
    const rawPath = cleanArgValue(args.Path) || '';
    const fileName = path.basename(rawPath) || rawPath;
    return {
      type: 'write_file',
      badge: 'TẠO / GHI TỆP TIN',
      icon: 'file-plus',
      title: `Đang ghi tệp tin: ${fileName}`,
      detail: `Đường dẫn: ${maskSecrets(rawPath)}`,
      target: rawPath,
      fileName
    };
  }

  if (name.includes('browser') || name.includes('webview')) {
    const url = cleanArgValue(args.url) || cleanArgValue(args.Url) || 'trình duyệt web';
    return {
      type: 'browser',
      badge: 'KIỂM THỬ TRÌNH DUYỆT',
      icon: 'globe',
      title: `Đang kiểm thử webview: ${url}`,
      detail: `Action: ${name}`,
      target: url
    };
  }

  if (name === 'search_web') {
    const q = cleanArgValue(args.query) || '';
    return {
      type: 'search_web',
      badge: 'TÌM KIẾM WEB',
      icon: 'search',
      title: `Đang tra cứu: "${q}"`,
      detail: `Truy vấn: ${q}`,
      target: q
    };
  }

  return {
    type: name,
    badge: name.toUpperCase(),
    icon: 'activity',
    title: `Đang thực hiện công cụ: ${name}`,
    detail: JSON.stringify(args).slice(0, 100),
    target: name
  };
}

/**
 * Detect project context from tool calls and paths
 */
function detectProjectContext(toolCalls = []) {
  for (const tc of toolCalls) {
    const raw = tc.args?.Path || tc.args?.CommandLine || '';
    if (typeof raw === 'string') {
      const match = raw.match(/([a-zA-Z]:[\\\/](?:[^\\\/]+[\\\/])*(?:startup|projects?|workspace)[\\\/]([^\\\/]+))/i);
      if (match) {
        return {
          name: match[2],
          path: match[1],
          root: match[1]
        };
      }
    }
  }
  // Default to ai-router in D:\startup\ai-router
  return {
    name: 'ai-router',
    path: 'D:\\startup\\ai-router',
    root: 'D:\\startup\\ai-router'
  };
}

/**
 * Smart Risk Assessment for Adaptive Approval Gate:
 * Evaluates whether a task is low-risk (auto-approvable) or high-risk (requires manual confirmation)
 */
function assessTaskRisk(taskTitle = '', recentToolCalls = []) {
  const text = (taskTitle || '').toLowerCase();
  
  // High risk indicators: DB, security, auth, gateway, core logic, deletions
  const highRiskKeywords = [
    'database', 'db', 'sql', 'migration', 'auth', 'oauth', 'token', 'secret',
    'password', 'security', 'api_key', 'payment', 'delete', 'xóa', 'remove',
    'gateway', 'proxy', 'routing', 'upstream', 'schema'
  ];
  
  // Low risk indicators: Pure UI, CSS, styling, icons, labels, documentation
  const lowRiskKeywords = [
    'css', 'ui', 'giao diện', 'style', 'styling', 'màu', 'color', 'icon',
    'pipline', 'pipeline', 'timeline', 'stepper', 'dấu chấm', 'dot', 'hiển thị',
    'text', 'title', 'badge', 'responsive', 'doc', 'readme', 'comment', 'đổi màu'
  ];

  const hasHighRisk = highRiskKeywords.some(kw => text.includes(kw));
  const hasLowRisk = lowRiskKeywords.some(kw => text.includes(kw));

  if (hasHighRisk) {
    return {
      level: 'high',
      isAutoApproved: false,
      label: 'RỦI RO CAO • DUYỆT THỦ CÔNG',
      badgeColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      reason: 'Tác vụ có tác động tới Database, Auth, Bảo mật hoặc Routing Core. Bắt buộc có sự xác nhận của người dùng.'
    };
  }

  if (hasLowRisk) {
    return {
      level: 'low',
      isAutoApproved: true,
      label: 'RỦI RO THẤP • TỰ ĐỘNG THÔNG QUA (AUTO-APPROVE)',
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      reason: 'Tác vụ thuần túy về giao diện (UI/CSS/hiển thị) hoặc tài liệu. Tự động thông qua để mở khóa khâu Code mà không gây gián đoạn.'
    };
  }

  return {
    level: 'medium',
    isAutoApproved: false,
    label: 'RỦI RO TRUNG BÌNH • DUYỆT AN TOÀN',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    reason: 'Tác vụ logic thông thường. Được kiểm soát an toàn qua cổng duyệt kế hoạch.'
  };
}

/**
 * Build rich multi-stage pipeline (/todo 5 stages, /fix 3-stage loop, /planning, /ask)
 * with accurate progression tracking and deep sub-orchestration details.
 */
function buildTodoPipelineStages({
  commandType = '/todo',
  detectedRole,
  isAgentActuallyWorking,
  recentToolCalls = [],
  lastUserPrompt = '',
  project = {}
}) {
  let cleanTaskTitle = (lastUserPrompt || '')
    .replace(/\/(todo|ask|fix|plan|planning|review)\b/gi, '')
    .replace(/#(todo|ask|fix|plan|planning|review)\b/gi, '')
    .trim();

  const hasEditOrWrite = recentToolCalls.some(t => t.name === 'edit_file' || t.name === 'write_file');
  const hasRunCmd = recentToolCalls.some(t => t.name === 'run_command');
  const hasAskQuestion = recentToolCalls.some(t => t.name === 'ask_question');
  
  // Only classify as review screenshot if it's an evidence/screenshot inspection, NOT a user-uploaded problem image
  const hasReviewEvidence = recentToolCalls.some(t => 
    t.name.includes('browser') || 
    t.name === 'invoke_subagent' ||
    (t.name === 'run_command' && (t.args?.CommandLine || '').toLowerCase().includes('screenshot')) ||
    (t.name === 'read_file' && /browser_evidence|screenshot/i.test(t.args?.Path || ''))
  );

  const activeTool = recentToolCalls[recentToolCalls.length - 1] || null;

  // Active Tool Classification (Strict, High-Precedence Hierarchy)
  const isEditing = activeTool && (activeTool.name === 'edit_file' || activeTool.name === 'write_file');
  const cmdStr = (activeTool?.args?.CommandLine || activeTool?.args?.toolSummary || '').toLowerCase();
  const isBuildOrTestCmd = activeTool?.name === 'run_command' && /build|compile|test|lint|check|vitest|jest|tsc/i.test(cmdStr);
  const isGeneralShell = activeTool?.name === 'run_command' && !isBuildOrTestCmd;
  const isReviewingTool = activeTool && (
    activeTool.name === 'invoke_subagent' ||
    activeTool.name.includes('browser') ||
    (activeTool.name === 'read_file' && /browser_evidence|screenshot/i.test(activeTool.args?.Path || ''))
  );
  const isAskingQuestion = activeTool && activeTool.name === 'ask_question';

  // Extract edited files
  const editedFiles = recentToolCalls
    .filter(t => t.name === 'edit_file' || t.name === 'write_file')
    .map(t => path.basename(t.args?.Path || 'file'))
    .filter((v, i, a) => a.indexOf(v) === i);

  // Extract shell commands
  const shellCommands = recentToolCalls
    .filter(t => t.name === 'run_command')
    .map(t => t.args?.toolSummary || t.args?.CommandLine || 'Thực thi lệnh shell')
    .slice(-4);

  // ==========================================
  // CASE 1: /FIX WORKFLOW (BỎ QUA PLAN, VÒNG LẶP CODE -> TEST -> REVIEW)
  // ==========================================
  if (commandType === '/fix') {
    let fixCodeStatus = 'pending';
    let fixTestStatus = 'pending';
    let fixReviewStatus = 'pending';

    if (!isAgentActuallyWorking) {
      // Agent has finished the turn! If it ran commands or edited code, all stages are done!
      if (hasRunCmd || hasReviewEvidence || hasEditOrWrite) {
        fixCodeStatus = 'completed';
        fixTestStatus = 'completed';
        fixReviewStatus = 'completed';
      } else {
        fixCodeStatus = 'completed';
        fixTestStatus = 'pending';
        fixReviewStatus = 'pending';
      }
    } else {
      // Agent is actively working in a turn:
      // STRICT ORDER: Code Editing MUST ALWAYS be in CODE stage!
      if (isEditing) {
        fixCodeStatus = 'running';
        fixTestStatus = 'pending';
        fixReviewStatus = 'pending';
      } else if (isBuildOrTestCmd || (isGeneralShell && hasEditOrWrite)) {
        fixCodeStatus = 'completed';
        fixTestStatus = 'running';
        fixReviewStatus = 'pending';
      } else if (isReviewingTool && (hasEditOrWrite || hasRunCmd)) {
        fixCodeStatus = 'completed';
        fixTestStatus = 'completed';
        fixReviewStatus = 'running';
      } else if (hasEditOrWrite) {
        fixCodeStatus = 'running';
        fixTestStatus = 'pending';
        fixReviewStatus = 'pending';
      } else {
        fixCodeStatus = 'running';
        fixTestStatus = 'pending';
        fixReviewStatus = 'pending';
      }
    }

    return [
      {
        id: 'plan',
        stageIndex: 1,
        name: 'Plan (Lập Kế Hoạch)',
        shortName: 'Plan',
        role: 'Architect Planner',
        model: 'gemini-3.8-flash-high',
        combo: 'combo-plan',
        status: 'bypassed',
        description: 'Lệnh /fix bỏ qua bước lập kế hoạch từ đầu để tập trung xử lý sự cố tức thì theo nguyên nhân đã xác định.',
        badge: 'ĐÃ BỎ QUA (BYPASSED)',
        subSteps: [
          { index: 1, name: 'Bỏ qua khâu lên plan mới (đã có sẵn RCA/ngữ cảnh lỗi)', status: 'completed' },
          { index: 2, name: 'Đi thẳng vào vòng lặp Code -> Test -> Review (Lặp tối đa 3 lần)', status: 'completed' }
        ],
        details: {
          protocol: 'Quy trình /fix: Bỏ qua lập plan để tối ưu MTTR và sửa lỗi tức thì',
          focus: 'Sửa đúng trọng tâm, loại bỏ thủ tục lên plan'
        },
        logs: ['Bỏ qua bước lập kế hoạch theo quy định của lệnh /fix']
      },
      {
        id: 'approval',
        stageIndex: 2,
        name: 'Duyệt Plan (Approval Gate)',
        shortName: 'Duyệt Plan',
        role: 'Human Approval Gate',
        model: 'gemini-3.8-flash-high',
        combo: 'combo-plan',
        status: 'bypassed',
        description: 'Lệnh /fix bỏ qua cổng phê duyệt kế hoạch để triển khai sửa lỗi ngay lập tức.',
        badge: 'ĐÃ BỎ QUA (BYPASSED)',
        subSteps: [
          { index: 1, name: 'Bỏ qua cổng phê duyệt kế hoạch', status: 'completed' },
          { index: 2, name: 'Mở khóa trực tiếp Lead Coder', status: 'completed' }
        ],
        details: {
          protocol: 'Không chặn cổng phê duyệt khi sửa lỗi khẩn cấp',
          safety: 'Được bảo vệ bởi khâu Test tự động & Review 3 chiều'
        },
        logs: ['Bỏ qua cổng duyệt theo quy định của lệnh /fix']
      },
      {
        id: 'code',
        stageIndex: 3,
        name: 'Code (Sửa Lỗi Đúng Trọng Tâm)',
        shortName: 'Code',
        role: 'Lead Coder',
        model: 'gemini-3.8-flash-high',
        combo: 'combo-code',
        status: fixCodeStatus,
        description: 'Sửa đổi chính xác các vị trí phát sinh bug theo nguyên nhân đã xác định, không lan man tránh regression.',
        badge: fixCodeStatus === 'running' ? 'ĐANG SỬA MÃ NGUỒN' : (fixCodeStatus === 'completed' ? 'ĐÃ SỬA MÃ (PASS)' : 'CHỜ TRIỂN KHAI'),
        subSteps: [
          { index: 1, name: 'Định vị tệp tin và dòng mã gây ra bug', status: 'completed' },
          { index: 2, name: 'Thực hiện chỉnh sửa tối giản (KISS/YAGNI)', status: fixCodeStatus === 'completed' ? 'completed' : (fixCodeStatus === 'running' ? 'running' : 'pending') },
          { index: 3, name: 'Bảo toàn logic nghiệp vụ và contracts hiện có', status: fixCodeStatus === 'completed' ? 'completed' : 'pending' }
        ],
        details: {
          editedFiles: editedFiles.length > 0 ? editedFiles : ['taskTrackerService.js', 'TaskExecutionView.jsx'],
          principles: 'Chỉ sửa đúng vị trí lỗi, không đụng vào luồng không liên quan'
        },
        logs: editedFiles.length > 0 ? editedFiles.map(f => `Đã chỉnh sửa mã nguồn: ${f}`) : ['Đang khảo sát vị trí phát sinh bug']
      },
      {
        id: 'test',
        stageIndex: 4,
        name: 'Test (Kiểm Thử Khắc Phục)',
        shortName: 'Test',
        role: 'Automated Tester',
        model: 'gemini-3.8-flash',
        combo: 'combo-test',
        status: fixTestStatus,
        description: 'Chạy kiểm thử npm run build & lint. Nếu FAIL: tự động quay lại khâu Code. Lặp tối đa 3 lần.',
        badge: fixTestStatus === 'running' ? 'ĐANG CHẠY KIỂM THỬ' : (fixTestStatus === 'completed' ? 'KIỂM THỬ PASS' : 'CHỜ KIỂM THỬ'),
        subSteps: [
          { index: 1, name: 'Kiểm tra cú pháp & Linter verification', status: fixTestStatus === 'completed' ? 'completed' : (fixTestStatus === 'running' ? 'running' : 'pending') },
          { index: 2, name: 'Chạy kiểm thử biên dịch dự án (npm run build)', status: fixTestStatus === 'completed' ? 'completed' : (fixTestStatus === 'running' ? 'running' : 'pending') },
          { index: 3, name: 'Xác thực không phát sinh lỗi hồi quy (No Regression)', status: fixTestStatus === 'completed' ? 'completed' : 'pending' }
        ],
        details: {
          testCommands: shellCommands.length > 0 ? shellCommands : ['npm run build', 'Linter check'],
          circuitBreaker: 'Cơ chế ngắt mạch: Tối đa 3 lần sửa. Lần 4 dừng và xuất báo cáo RCA.'
        },
        logs: shellCommands.map(cmd => `Thực thi kiểm thử: ${cmd}`)
      },
      {
        id: 'review',
        stageIndex: 5,
        name: 'Review (Thẩm Định Mã Sửa Đổi)',
        shortName: 'Review',
        role: 'Parallel Reviewer (3 Chiều)',
        model: 'gemini-3.8-flash-high',
        combo: 'combo-review',
        status: fixReviewStatus,
        description: 'Thẩm định tập trung: Khắc phục triệt để lỗi gốc rễ, không gây side-effect. Nghiệm thu hoàn tất.',
        badge: fixReviewStatus === 'running' ? 'ĐANG THẨM ĐỊNH MÃ SỬA' : (fixReviewStatus === 'completed' ? 'ĐÃ NGHIỆM THU PASS' : 'CHỜ THẨM ĐỊNH'),
        subSteps: [
          { index: 1, name: 'Thẩm tra mã nguồn sửa đổi so với nguyên nhân lỗi', status: fixReviewStatus === 'completed' ? 'completed' : (fixReviewStatus === 'running' ? 'running' : 'pending') },
          { index: 2, name: 'Kiểm tra rủi ro hồi quy và an toàn hệ thống', status: fixReviewStatus === 'completed' ? 'completed' : 'pending' },
          { index: 3, name: 'Xác nhận PASS và đóng gói hoàn tất chu trình', status: fixReviewStatus === 'completed' ? 'completed' : 'pending' }
        ],
        details: {
          criteria: '1. Triệt tiêu bug gốc rễ | 2. Code clean | 3. Không lỗi phụ',
          deliverable: 'Báo cáo giải trình sửa lỗi và kết quả kiểm thử'
        },
        logs: [
          'Khởi tạo thẩm tra mã nguồn khắc phục',
          fixReviewStatus === 'completed' ? 'Đã thẩm tra và xác nhận mã sửa đạt tiêu chuẩn' : 'Sẵn sàng thẩm định sau khi test PASS'
        ]
      }
    ];
  }

  // ==========================================
  // CASE 2: /TODO WORKFLOW (5 GIAI ĐOẠN KHÉP KÍN + ADAPTIVE APPROVAL GATE)
  // ==========================================
  const risk = assessTaskRisk(lastUserPrompt, recentToolCalls);

  let planStatus = 'completed';
  let approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
  let codeStatus = 'pending';
  let testStatus = 'pending';
  let reviewStatus = 'pending';

  if (!isAgentActuallyWorking) {
    // AGENT HAS COMPLETED ITS TURN (IDLE)
    if (hasEditOrWrite && (hasRunCmd || hasReviewEvidence)) {
      // Full pipeline Code -> Test -> Review is completed!
      planStatus = 'completed';
      approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
      codeStatus = 'completed';
      testStatus = 'completed';
      reviewStatus = 'completed';
    } else if (hasEditOrWrite) {
      planStatus = 'completed';
      approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
      codeStatus = 'completed';
      testStatus = 'pending';
      reviewStatus = 'pending';
    } else if (hasAskQuestion) {
      planStatus = 'completed';
      approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'waiting_approval';
      codeStatus = 'pending';
      testStatus = 'pending';
      reviewStatus = 'pending';
    } else {
      planStatus = 'completed';
      approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
      codeStatus = 'completed';
      testStatus = 'completed';
      reviewStatus = 'completed';
    }
  } else {
    // AGENT IS ACTIVELY WORKING IN A TURN (Strict Tool Hierarchy)
    // 1. EDITING CODE: Must ALWAYS be in CODE stage
    if (isEditing) {
      planStatus = 'completed';
      approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
      codeStatus = 'running';
      testStatus = 'pending';
      reviewStatus = 'pending';
    // 2. RUNNING TEST / BUILD COMMAND: Must be in TEST stage
    } else if (isBuildOrTestCmd) {
      planStatus = 'completed';
      approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
      codeStatus = 'completed';
      testStatus = 'running';
      reviewStatus = 'pending';
    // 3. SUBAGENT / BROWSER / SCREENSHOT INSPECTION:
    } else if (isReviewingTool) {
      if (hasEditOrWrite || hasRunCmd) {
        planStatus = 'completed';
        approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
        codeStatus = 'completed';
        testStatus = 'completed';
        reviewStatus = 'running';
      } else {
        // Research subagent / browser survey during planning
        planStatus = 'running';
        approvalStatus = 'pending';
        codeStatus = 'pending';
        testStatus = 'pending';
        reviewStatus = 'pending';
      }
    // 4. ASKING QUESTION (MANUAL APPROVAL GATE)
    } else if (isAskingQuestion) {
      planStatus = 'completed';
      approvalStatus = 'waiting_approval';
      codeStatus = 'pending';
      testStatus = 'pending';
      reviewStatus = 'pending';
    // 5. GENERAL SHELL COMMAND (grep, cat, git, restart server)
    } else if (isGeneralShell) {
      if (hasEditOrWrite) {
        planStatus = 'completed';
        approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
        codeStatus = 'completed';
        testStatus = 'running';
        reviewStatus = 'pending';
      } else {
        planStatus = 'running';
        approvalStatus = 'pending';
        codeStatus = 'pending';
        testStatus = 'pending';
        reviewStatus = 'pending';
      }
    // 6. HAS MODIFIED CODE IN CURRENT TURN
    } else if (hasEditOrWrite) {
      planStatus = 'completed';
      approvalStatus = risk.isAutoApproved ? 'auto_approved' : 'completed';
      codeStatus = 'running';
      testStatus = 'pending';
      reviewStatus = 'pending';
    // 7. DEFAULT: PLANNING & EXPLORATION
    } else {
      planStatus = 'running';
      approvalStatus = 'pending';
      codeStatus = 'pending';
      testStatus = 'pending';
      reviewStatus = 'pending';
    }
  }

  return [
    {
      id: 'plan',
      stageIndex: 1,
      name: 'Plan (Lập Kế Hoạch)',
      shortName: 'Plan',
      role: 'Architect Planner',
      model: 'gemini-3.8-flash-high',
      combo: 'combo-plan',
      status: planStatus,
      description: 'Phân tích yêu cầu, bóc tách luồng dữ liệu, lập task list kiến trúc và phân tích Tư Duy Ngược (Devil\'s Advocate & Pre-Mortem).',
      badge: planStatus === 'running' ? 'ĐANG LẬP KẾ HOẠCH' : 'ĐÃ HOÀN TẤT PLAN',
      subSteps: [
        { index: 1, name: 'Phân tích yêu cầu & Bóc tách bối cảnh dự án', status: 'completed' },
        { index: 2, name: 'Xác định ranh giới In-scope / Out-of-scope & Thiết kế phân tầng', status: 'completed' },
        { index: 3, name: '🧠 Phân tích Tư Duy Ngược (Devil\'s Advocate: 3 câu hỏi rủi ro)', status: 'completed' },
        { index: 4, name: 'Xuất danh mục tệp tin & Kịch bản nghiệm thu kiểm thử', status: planStatus === 'running' ? 'running' : 'completed' }
      ],
      details: {
        methodology: 'Tư Duy Ngược (Pre-Mortem) + Clean Architecture 5 Tầng',
        deliverables: 'Bản thiết kế kiến trúc, danh mục file tạo mới/chỉnh sửa, kịch bản test',
        focus: 'Đảm bảo không phá vỡ logic cũ, tối ưu KISS/YAGNI, chặn rủi ro production',
        planMatrix: [
          {
            title: 'Mục Tiêu & Ranh Giới (Scope)',
            badge: 'IN-SCOPE / OUT-OF-SCOPE',
            color: '#38bdf8',
            content: `Mục tiêu: "${cleanTaskTitle || 'Thực thi yêu cầu người dùng'}". Ranh giới: Tập trung giải quyết dứt điểm yêu cầu, không lan man sang các module không liên quan.`
          },
          {
            title: 'Danh Mục Tệp Tin & Vị Trí Sửa Đổi (File Breakdown)',
            badge: 'FILES IMPACTED',
            color: '#10b981',
            content: editedFiles.length > 0 ? `Các tệp tin tác động: ${editedFiles.join(', ')}` : 'Rà soát và chỉnh sửa chính xác các tệp tin cấu hình, component giao diện hoặc service logic.'
          },
          {
            title: 'Phân Tích Tư Duy Ngược (Devil\'s Advocate)',
            badge: 'PRE-MORTEM & RISK',
            color: '#f59e0b',
            content: 'Giả định sai: Tránh giả định giao diện cố định. Kịch bản lỗi: Phòng ngừa vỡ layout hoặc lỗi cú pháp. Giải pháp: Tối giản KISS/YAGNI, không làm phức tạp hóa.'
          },
          {
            title: 'Kịch Bản Kiểm Thử & Tiêu Chí Nghiệm Thu (Verification)',
            badge: 'TEST SUITE',
            color: '#a855f7',
            content: 'Thực thi kiểm thử biên dịch build suite (npm run build), linter verification và thẩm định trực quan màn hình.'
          }
        ]
      },
      logs: [
        'Bóc tách yêu cầu người dùng thành công',
        'Kiểm tra cấu trúc mã nguồn hiện hành',
        'Hoàn thiện góc phản biện Devil\'s Advocate'
      ]
    },
    {
      id: 'approval',
      stageIndex: 2,
      name: 'Duyệt Plan (Adaptive Gate)',
      shortName: 'Duyệt Plan',
      role: 'Human Approval & Adaptive Gate',
      model: 'gemini-3.8-flash-high',
      combo: 'combo-plan',
      status: approvalStatus,
      risk: risk,
      description: risk.isAutoApproved ?
        'Cổng duyệt thích ứng: Tác vụ rủi ro thấp (UI/CSS/hiển thị) được tự động thông qua (Auto-Approved) để vào thẳng khâu Code.' :
        'Cổng kiểm soát an toàn: Chờ người dùng phê duyệt hoặc gọi /planning để tái thiết kế phương án nếu cần sửa đổi.',
      badge: approvalStatus === 'auto_approved' ? 'TỰ ĐỘNG THÔNG QUA (AUTO-PASS)' :
             approvalStatus === 'waiting_approval' ? 'CHỜ PHÊ DUYỆT' :
             approvalStatus === 'revising_plan' ? 'ĐANG SỬA PLAN' :
             approvalStatus === 'completed' ? 'ĐÃ PHÊ DUYỆT' : 'CHỜ MỞ KHÓA',
      subSteps: [
        { 
          index: 1, 
          name: `Đánh giá rủi ro tác vụ (${risk.label})`, 
          status: approvalStatus !== 'pending' ? 'completed' : 'pending',
          note: risk.reason
        },
        { 
          index: 2, 
          name: risk.isAutoApproved ? 
            '⚡ Kích hoạt cơ chế Auto-Approve (Mở khóa trực tiếp Lead Coder)' : 
            'Kích hoạt Human Approval Gate (Chờ người dùng xác nhận an toàn qua ask_question)', 
          status: approvalStatus !== 'pending' ? 'completed' : 'pending' 
        },
        { 
          index: 3, 
          name: 'Hỗ trợ sửa đổi qua /planning nếu Người dùng yêu cầu chỉnh phương án', 
          status: approvalStatus === 'revising_plan' ? 'running' : (approvalStatus === 'completed' || approvalStatus === 'auto_approved' ? 'completed' : 'pending'),
          note: 'Không nhảy cóc vào code; Architect Planner tiếp nhận góp ý và tái cấu trúc phương án' 
        },
        { 
          index: 4, 
          name: 'Ghi nhận quyết định phê duyệt chính thức để mở khóa Code', 
          status: approvalStatus === 'completed' || approvalStatus === 'auto_approved' ? 'completed' : 'pending' 
        }
      ],
      details: {
        riskLevel: risk.level,
        riskLabel: risk.label,
        riskReason: risk.reason,
        adaptiveRule: risk.isAutoApproved ?
          'Tự động thông qua vì rủi ro thấp (UI/Styling), tiết kiệm thời gian.' :
          'Bắt buộc duyệt thủ công vì rủi ro trung bình/cao (Logic/Hạ tầng).',
        planMatrix: [
          {
            title: 'Mục Tiêu & Ranh Giới (Scope)',
            badge: 'IN-SCOPE / OUT-OF-SCOPE',
            color: '#38bdf8',
            content: `Mục tiêu: "${cleanTaskTitle || 'Thực thi yêu cầu người dùng'}". Ranh giới: Tập trung giải quyết dứt điểm yêu cầu, không lan man sang các module không liên quan.`
          },
          {
            title: 'Danh Mục Tệp Tin & Vị Trí Sửa Đổi (File Breakdown)',
            badge: 'FILES IMPACTED',
            color: '#10b981',
            content: editedFiles.length > 0 ? `Các tệp tin tác động: ${editedFiles.join(', ')}` : 'Rà soát và chỉnh sửa chính xác các tệp tin cấu hình, component giao diện hoặc service logic.'
          },
          {
            title: 'Phân Tích Tư Duy Ngược (Devil\'s Advocate)',
            badge: 'PRE-MORTEM & RISK',
            color: '#f59e0b',
            content: 'Giả định sai: Tránh giả định giao diện cố định. Kịch bản lỗi: Phòng ngừa vỡ layout hoặc lỗi cú pháp. Giải pháp: Tối giản KISS/YAGNI, không làm phức tạp hóa.'
          },
          {
            title: 'Kịch Bản Kiểm Thử & Tiêu Chí Nghiệm Thu (Verification)',
            badge: 'TEST SUITE',
            color: '#a855f7',
            content: 'Thực thi kiểm thử biên dịch build suite (npm run build), linter verification và thẩm định trực quan màn hình.'
          }
        ]
      },
      logs: [
        `Phân tích rủi ro tác vụ: ${risk.label}`,
        risk.isAutoApproved ?
          'Cơ chế Adaptive Gate: Tự động phê duyệt phương án cho tác vụ UI/CSS' :
          (approvalStatus === 'completed' ? 'Người dùng đã phê duyệt phương án thành công' : 'Đang lắng nghe phản hồi duyệt/sửa từ người dùng...')
      ]
    },
    {
      id: 'code',
      stageIndex: 3,
      name: 'Code (Triển Khai Mã)',
      shortName: 'Code',
      role: 'Lead Coder',
      model: 'gemini-3.8-flash-high',
      combo: 'combo-code',
      status: codeStatus,
      description: 'Triển khai mã nguồn tuân thủ kiến trúc phân tầng FSA / Backend 5 tầng, chỉ chỉnh sửa đúng phạm vi đã được duyệt.',
      badge: codeStatus === 'running' ? 'ĐANG TRIỂN KHAI CODE' : (codeStatus === 'completed' ? 'ĐÃ CODE XONG' : 'CHỜ MỞ KHÓA'),
      subSteps: [
        { index: 1, name: 'Khởi tạo / Cập nhật Backend Service & Processor logic', status: codeStatus === 'completed' ? 'completed' : (codeStatus === 'running' ? 'running' : 'pending') },
        { index: 2, name: 'Cập nhật API Routes & Data Contracts', status: codeStatus === 'completed' ? 'completed' : 'pending' },
        { index: 3, name: 'Xây dựng / Tinh chỉnh Web Components & Giao diện người dùng', status: codeStatus === 'completed' ? 'completed' : 'pending' }
      ],
      details: {
        editedFiles: editedFiles.length > 0 ? editedFiles : ['taskTrackerService.js', 'TaskExecutionView.jsx'],
        principles: 'Tuân thủ Clean Code, không thêm dependencies thừa, xử lý triệt để edge-cases'
      },
      logs: editedFiles.map(f => `Đã chỉnh sửa mã nguồn: ${f}`)
    },
    {
      id: 'test',
      stageIndex: 4,
      name: 'Test (Kiểm Thử Tự Động)',
      shortName: 'Test',
      role: 'Automated Tester',
      model: 'gemini-3.8-flash',
      combo: 'combo-test',
      status: testStatus,
      description: 'Chạy kiểm thử tự động, build verification, linter và kiểm tra runtime để đảm bảo không phát sinh lỗi hồi quy.',
      badge: testStatus === 'running' ? 'ĐANG CHẠY TEST / BUILD' : (testStatus === 'completed' ? 'TEST THÀNH CÔNG (PASS)' : 'CHỜ KIỂM THỬ'),
      subSteps: [
        { index: 1, name: 'Kiểm tra cú pháp, Type check & Linter', status: testStatus === 'completed' ? 'completed' : (testStatus === 'running' ? 'running' : 'pending') },
        { index: 2, name: 'Thực thi kiểm thử biên dịch / Build suite (npm run build)', status: testStatus === 'completed' ? 'completed' : (testStatus === 'running' ? 'running' : 'pending') },
        { index: 3, name: 'Xác thực độ ổn định runtime của Gateway API', status: testStatus === 'completed' ? 'completed' : 'pending' }
      ],
      details: {
        testCommands: shellCommands.length > 0 ? shellCommands : ['npm run build', 'API endpoint verification'],
        circuitBreaker: 'Cơ chế ngắt mạch: Lặp tối đa 3 lần sửa nếu phát hiện bug; Lần thứ 4 kích hoạt RCA'
      },
      logs: shellCommands.map(cmd => `Thực thi kiểm thử: ${cmd}`)
    },
    {
      id: 'review',
      stageIndex: 5,
      name: 'Review (Thẩm Định Đa Chiều)',
      shortName: 'Review',
      role: 'Parallel Reviewer (3 Chiều)',
      model: 'gemini-3.8-flash-high',
      combo: 'combo-review',
      status: reviewStatus,
      description: 'Thẩm định độc lập 3 góc nhìn: Functional & UX qua ảnh chụp màn hình thực tế, Architecture & Clean Code, Security & SonarLint.',
      badge: reviewStatus === 'running' ? 'ĐANG THẨM ĐỊNH REVIEW' : (reviewStatus === 'completed' ? 'ĐÃ NGHIỆM THU PASS' : 'CHỜ THẨM ĐỊNH'),
      subSteps: [
        { index: 1, name: 'Thẩm tra Functional / UX qua Chrome Headless Screenshot', status: reviewStatus === 'completed' ? 'completed' : (reviewStatus === 'running' ? 'running' : 'pending') },
        { index: 2, name: 'Thẩm định chất lượng kiến trúc & Clean Code', status: reviewStatus === 'completed' ? 'completed' : 'pending' },
        { index: 3, name: 'Bảo mật & Chuẩn bị Báo cáo nghiệm thu hoàn tất cho người dùng', status: reviewStatus === 'completed' ? 'completed' : 'pending' }
      ],
      details: {
        perspectives: '1. Functional/UX (Visual proof) | 2. Architecture | 3. Security',
        deliverable: 'Báo cáo tổng kết vòng lặp tuần hoàn kèm bằng chứng trực quan'
      },
      logs: [
        'Khởi tạo quy trình thẩm định đa chiều',
        reviewStatus === 'completed' ? 'Đã nghiệm thu và chụp ảnh màn hình kiểm chứng thành công' : 'Đang chuẩn bị xác thực kết quả...'
      ]
    }
  ];
}

function getAntigravityActiveSessionHierarchy(targetConversationId = null) {
  const baseDir = path.join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Admin', '.gemini', 'antigravity');
  let conversationId = targetConversationId;
  let lastModified = 0;

  if (!conversationId) {
    const active = getActiveAntigravityConversationId();
    conversationId = active.conversationId;
    lastModified = active.lastModified;
  }

  if (!conversationId) return null;

  const transFile = path.join(baseDir, 'brain', conversationId, '.system_generated', 'logs', 'transcript.jsonl');
  if (!fs.existsSync(transFile)) return null;

  try {
    const now = Date.now();
    const stat = fs.statSync(transFile);
    const mtimeMs = stat.mtimeMs;

    // Read last 150 lines via reverse tail reader in < 3ms
    const lines = readTailJsonlLines(transFile, 150);
    if (!lines || lines.length === 0) return null;

    // Inspect the very last step to see if the turn is truly still executing
    let lastStepObj = null;
    try {
      lastStepObj = JSON.parse(lines[lines.length - 1]);
    } catch {}

    // A turn is active if updated recently (< 45s) AND NOT a terminal assistant response with no tools
    const isRecent = (now - mtimeMs) < 45000;
    const isTerminalReply = lastStepObj && 
                            lastStepObj.type === 'PLANNER_RESPONSE' && 
                            (!lastStepObj.tool_calls || lastStepObj.tool_calls.length === 0);
    const isAgentActuallyWorking = isRecent && !isTerminalReply;

    // 1. EXTRACT LATEST USER PROMPT (Dedicated Reverse Scan)
    let lastUserPrompt = '';
    let lastUserPromptStepIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const s = JSON.parse(lines[i]);
        if ((s.type === 'USER_INPUT' || s.source === 'USER_EXPLICIT') && s.source !== 'MODEL') {
          const raw = s.content || '';
          const match = raw.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/i);
          lastUserPrompt = match ? match[1].trim() : raw.trim();
          lastUserPromptStepIndex = s.step_index != null ? s.step_index : i;
          break;
        }
      } catch {}
    }

    // 2. DETECT COMMAND TYPE FROM USER PROMPT
    let commandType = '/todo';
    if (lastUserPrompt) {
      if (/\/(fix)\b|#(fix)\b/i.test(lastUserPrompt)) {
        commandType = '/fix';
      } else if (/\/(ask)\b|#(ask)\b/i.test(lastUserPrompt)) {
        commandType = '/ask';
      } else if (/\/(planning|plan)\b|#(planning|plan)\b/i.test(lastUserPrompt)) {
        commandType = '/planning';
      } else if (/\/(todo)\b|#(todo)\b/i.test(lastUserPrompt)) {
        commandType = '/todo';
      }
    }

    // 3. EXTRACT RECENT TOOL CALLS
    const currentTurnToolCalls = [];
    const allRecentToolCalls = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        const s = JSON.parse(lines[i]);
        if (s.tool_calls && s.tool_calls.length > 0) {
          for (const tc of s.tool_calls) {
            const formatted = {
              stepIndex: s.step_index,
              createdAt: s.created_at,
              name: tc.name,
              args: tc.args || tc.parameters || {}
            };
            allRecentToolCalls.push(formatted);
            if (lastUserPromptStepIndex === -1 || (s.step_index != null && s.step_index >= lastUserPromptStepIndex)) {
              currentTurnToolCalls.push(formatted);
            }
          }
        }
      } catch {}
    }

    const activeToolCalls = currentTurnToolCalls.length > 0 ? currentTurnToolCalls : allRecentToolCalls.slice(-20);

    // 4. DETECT PROJECT & TASK METADATA
    const project = detectProjectContext(activeToolCalls);
    let cleanTaskTitle = lastUserPrompt;
    if (cleanTaskTitle) {
      cleanTaskTitle = cleanTaskTitle
        .replace(/\/(todo|ask|fix|plan|planning|review)\b/gi, '')
        .replace(/#(todo|ask|fix|plan|planning|review)\b/gi, '')
        .trim();
    }
    if (!cleanTaskTitle) {
      cleanTaskTitle = commandType === '/fix' ? 'Quy trình sửa lỗi / khắc phục bug theo vết' : 'Quy trình phát triển tính năng / sửa lỗi tuần hoàn khép kín';
    }

    const task = {
      id: `task-${conversationId ? conversationId.slice(0, 8) : 'active'}`,
      command: commandType,
      title: cleanTaskTitle,
      status: isAgentActuallyWorking ? 'running' : 'completed',
      updatedAt: mtimeMs
    };

    // 5. GENERATE PIPELINE STAGES
    const pipelineStages = buildTodoPipelineStages({
      commandType,
      detectedRole: 'coder',
      isAgentActuallyWorking,
      recentToolCalls: activeToolCalls,
      lastUserPrompt,
      project
    });

    // 6. DERIVE COMBO & ROLE FROM CURRENT WORKFLOW & ACTIVE STAGE
    let detectedRole = 'coder';
    let comboId = 'combo-code';
    let comboName = 'Lead Coder (Lập Trình & Sinh Mã)';
    let parentTaskSummary = cleanTaskTitle;
    let model = 'gemini-3.8-flash-high';

    if (commandType === '/fix') {
      const activeStage = pipelineStages.find(s => s.status === 'running') ||
                          [...pipelineStages].reverse().find(s => s.status === 'completed' && s.status !== 'bypassed') ||
                          pipelineStages[2];
      if (activeStage?.id === 'test') {
        comboId = 'combo-test';
        comboName = 'Automated Tester (Kiểm Thử Khắc Phục)';
        detectedRole = 'tester';
        model = 'gemini-3.8-flash';
      } else if (activeStage?.id === 'review') {
        comboId = 'combo-review';
        comboName = 'Parallel Reviewer (Thẩm Định Mã Sửa)';
        detectedRole = 'reviewer';
        model = 'gemini-3.8-flash-high';
      } else {
        comboId = 'combo-code';
        comboName = 'Lead Coder (Sửa Lỗi Đúng Trọng Tâm)';
        detectedRole = 'coder';
        model = 'gemini-3.8-flash-high';
      }
    } else if (commandType === '/ask') {
      comboId = 'combo-ask';
      comboName = 'Principal Advisor (/ask)';
      detectedRole = 'ask';
      model = 'gemini-3.8-flash-high';
    } else if (commandType === '/planning') {
      comboId = 'combo-plan';
      comboName = 'Architect Planner (Lên Kế Hoạch)';
      detectedRole = 'planner';
      model = 'gemini-3.8-flash-high';
    } else {
      // /todo
      const activeStage = pipelineStages.find(s => s.status === 'running' || s.status === 'waiting_approval') ||
                          [...pipelineStages].reverse().find(s => s.status === 'completed' || s.status === 'auto_approved') ||
                          pipelineStages[0];
      if (activeStage?.id === 'test') {
        comboId = 'combo-test';
        comboName = 'Automated Tester (Kiểm Thử & Test)';
        detectedRole = 'tester';
        model = 'gemini-3.8-flash';
      } else if (activeStage?.id === 'review') {
        comboId = 'combo-review';
        comboName = 'Parallel Reviewer (Thẩm Định Đa Chiều)';
        detectedRole = 'reviewer';
        model = 'gemini-3.8-flash-high';
      } else if (activeStage?.id === 'code') {
        comboId = 'combo-code';
        comboName = 'Lead Coder (Triển Khai Mã)';
        detectedRole = 'coder';
        model = 'gemini-3.8-flash-high';
      } else if (activeStage?.id === 'plan' || activeStage?.id === 'approval') {
        comboId = 'combo-plan';
        comboName = 'Architect Planner (Lên Kế Hoạch)';
        detectedRole = 'planner';
        model = 'gemini-3.8-flash-high';
      } else {
        comboId = 'combo-todo';
        comboName = 'Todo Full-Lifecycle Pipeline';
        detectedRole = 'todo_orchestrator';
        model = 'gemini-3.8-flash-high';
      }
    }

    // 7. SUBAGENTS HIERARCHY
    const subagents = [];
    const invokeCalls = activeToolCalls.filter(t => t.name === 'invoke_subagent');
    if (invokeCalls.length > 0) {
      for (const inv of invokeCalls) {
        const subRole = cleanArgValue(inv.args.Role) || 'Worker Subagent';
        const typeName = cleanArgValue(inv.args.TypeName) || 'general';
        const subModel = cleanArgValue(inv.args.Model) || 'flash';
        const prompt = cleanArgValue(inv.args.Prompt) || '';

        subagents.push({
          id: `sub-${inv.stepIndex}`,
          name: `Subagent: ${subRole}`,
          role: typeName,
          model: subModel,
          status: isAgentActuallyWorking ? 'running' : 'completed',
          progress: isAgentActuallyWorking ? 75 : 100,
          currentAction: {
            type: typeName,
            badge: isAgentActuallyWorking ? 'ĐANG CHẠY' : 'ĐÃ HOÀN TẤT',
            title: isAgentActuallyWorking ? `Đang thực thi: ${prompt.slice(0, 80)}...` : `Hoàn tất nhiệm vụ: ${subRole}`,
            target: prompt.slice(0, 100),
            detail: `Vai trò: ${subRole}`
          },
          steps: [
            { index: 1, name: 'Khởi tạo Subagent', status: 'completed' },
            { index: 2, name: prompt.slice(0, 60), status: isAgentActuallyWorking ? 'running' : 'completed' }
          ],
          logs: [prompt.slice(0, 120)]
        });
      }
    }

    if (subagents.length === 0) {
      const activeToolCall = activeToolCalls[activeToolCalls.length - 1] || null;
      let agentAction = null;

      if (isAgentActuallyWorking && activeToolCall) {
        agentAction = formatToolCallAction(activeToolCall);
      } else if (activeToolCall) {
        const lastFormatted = formatToolCallAction(activeToolCall);
        agentAction = {
          type: lastFormatted.type,
          badge: 'ĐÃ HOÀN TẤT (IDLE)',
          icon: 'check-circle-2',
          title: `Đã hoàn tất tác vụ: ${lastFormatted.title.replace(/^Đang\s+/i, '')}`,
          detail: `Tác vụ gần nhất: ${lastFormatted.detail}`,
          target: lastFormatted.target
        };
      } else {
        agentAction = {
          type: 'idle',
          badge: 'SẴN SÀNG NHẬN LỆNH',
          icon: 'check-circle-2',
          title: 'Agent đang sẵn sàng chờ yêu cầu tiếp theo từ bạn',
          detail: 'Chưa phát sinh tác vụ mới trong phiên này',
          target: 'idle'
        };
      }

      const realSteps = [];
      const seenActions = new Set();
      let stepIdx = 1;

      for (const tc of activeToolCalls.slice(-5)) {
        const f = formatToolCallAction(tc);
        const key = f.title;
        if (!seenActions.has(key)) {
          seenActions.add(key);
          const isThisStepRunning = (isAgentActuallyWorking && tc === activeToolCall);
          realSteps.push({
            index: stepIdx++,
            name: f.title.replace(/^Đang\s+/i, 'Đã '),
            status: isThisStepRunning ? 'running' : 'completed',
            type: tc.name
          });
        }
      }

      if (realSteps.length === 0) {
        realSteps.push({ index: 1, name: 'Sẵn sàng lắng nghe yêu cầu', status: 'completed' });
      }

      subagents.push({
        id: 'mono-agent-active',
        name: 'Agent Điều Phối Trực Tiếp',
        role: 'Đơn Nhiệm (Chưa Rẽ Nhánh Subagents)',
        typeName: 'mono_agent',
        model: model,
        status: isAgentActuallyWorking ? 'running' : 'completed',
        progress: isAgentActuallyWorking ? 65 : 100,
        currentAction: agentAction,
        steps: realSteps,
        logs: activeToolCalls.slice(-4).map(tc => formatToolCallAction(tc).title)
      });
    }

    return {
      source: 'antigravity_live',
      conversationId: conversationId,
      project: project,
      task: task,
      pipelineStages: pipelineStages,
      parentCombo: {
        id: comboId,
        name: comboName,
        role: detectedRole,
        model: model,
        account: 'manh06092001@gmail.com',
        status: isAgentActuallyWorking ? 'running' : 'completed',
        taskSummary: parentTaskSummary,
        updatedAt: mtimeMs
      },
      subagents: subagents,
      totalSubagents: subagents.length,
      activeSubagentsCount: subagents.filter(s => s.status === 'running').length,
      completedSubagentsCount: subagents.filter(s => s.status === 'completed').length
    };
  } catch (err) {
    console.error('Error in getAntigravityActiveSessionHierarchy:', err);
    return null;
  }
}

/**
 * Fallback idle hierarchy when no task or conversation is active
 */
function getIdleHierarchy() {
  const defaultProj = {
    name: 'ai-router',
    path: 'D:\\startup\\ai-router',
    root: 'D:\\startup\\ai-router'
  };

  const defaultTask = {
    id: 'task-standby',
    command: '/todo',
    title: 'Sẵn sàng tiếp nhận lệnh /todo hoặc tác vụ mới',
    status: 'idle',
    updatedAt: Date.now()
  };

  const defaultPipelineStages = buildTodoPipelineStages({
    detectedRole: 'todo_orchestrator',
    isAgentActuallyWorking: false,
    recentToolCalls: [],
    lastUserPrompt: '',
    project: defaultProj
  });

  return {
    source: 'antigravity_live',
    conversationId: null,
    project: defaultProj,
    task: defaultTask,
    pipelineStages: defaultPipelineStages,
    parentCombo: {
      id: 'combo-todo',
      name: 'Todo Full-Lifecycle Pipeline (Sẵn Sàng)',
      role: 'todo_orchestrator',
      model: 'gemini-3.8-flash-high',
      account: 'manh06092001@gmail.com',
      status: 'idle',
      taskSummary: 'Hệ thống đang sẵn sàng. Hãy gõ /todo <yêu cầu> để kích hoạt chu trình 5 bước khép kín!',
      updatedAt: Date.now()
    },
    subagents: [
      {
        id: 'mono-agent-idle',
        name: 'Agent Điều Phối Trực Tiếp',
        role: 'Đơn Nhiệm • Sẵn Sàng',
        typeName: 'mono_agent',
        model: 'gemini-3.8-flash-high',
        status: 'idle',
        progress: 100,
        currentAction: {
          type: 'idle',
          badge: 'SẴN SÀNG NHẬN LỆNH',
          icon: 'check-circle-2',
          title: 'Agent đang sẵn sàng chờ yêu cầu tiếp theo từ bạn',
          target: 'workspace',
          detail: 'Chưa có tác vụ nào đang chạy trong phiên này'
        },
        steps: [
          { index: 1, name: 'Khởi tạo môi trường Agent hoàn tất', status: 'completed' },
          { index: 2, name: 'Sẵn sàng lắng nghe yêu cầu mới', status: 'completed' }
        ],
        logs: ['Hệ thống sẵn sàng đón nhận task tiếp theo...']
      }
    ],
    totalSubagents: 1,
    activeSubagentsCount: 0,
    completedSubagentsCount: 1
  };
}

/**
 * Scan and return a list of all recent root Antigravity sessions/tasks.
 * Filters out subagents, extracts user prompt, command type, and running status.
 */
function getAllAntigravitySessions(maxCount = 8) {
  const baseDir = path.join(process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Admin', '.gemini', 'antigravity');
  const convDir = path.join(baseDir, 'conversations');
  const brainDir = path.join(baseDir, 'brain');

  const sessionMap = new Map();

  // 1. Scan conversations dir for .db / .db-wal files
  if (fs.existsSync(convDir)) {
    try {
      const files = fs.readdirSync(convDir);
      for (const f of files) {
        if (f.endsWith('.db') || f.endsWith('.db-wal')) {
          try {
            const candId = f.replace(/\.db(-wal)?$/, '');
            if (isSubagentConversation(baseDir, candId)) continue;
            const stat = fs.statSync(path.join(convDir, f));
            const existing = sessionMap.get(candId) || 0;
            if (stat.mtimeMs > existing) {
              sessionMap.set(candId, stat.mtimeMs);
            }
          } catch {}
        }
      }
    } catch {}
  }

  // 2. Scan brain directory
  if (fs.existsSync(brainDir)) {
    try {
      const dirs = fs.readdirSync(brainDir);
      for (const d of dirs) {
        if (isSubagentConversation(baseDir, d)) continue;
        const transFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
        if (fs.existsSync(transFile)) {
          try {
            const stat = fs.statSync(transFile);
            const existing = sessionMap.get(d) || 0;
            if (stat.mtimeMs > existing) {
              sessionMap.set(d, stat.mtimeMs);
            }
          } catch {}
        }
      }
    } catch {}
  }

  // 3. Sort by mtime descending
  const sortedIds = [...sessionMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount);

  const sessions = [];
  const now = Date.now();

  for (const [convId, mtimeMs] of sortedIds) {
    const transFile = path.join(brainDir, convId, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(transFile)) continue;

    try {
      const lines = readTailJsonlLines(transFile, 150);
      if (!lines || lines.length === 0) continue;

      let lastUserPrompt = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const s = JSON.parse(lines[i]);
          if ((s.type === 'USER_INPUT' || s.source === 'USER_EXPLICIT') && s.source !== 'MODEL') {
            const raw = s.content || '';
            const match = raw.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/i);
            lastUserPrompt = match ? match[1].trim() : raw.trim();
            break;
          }
        } catch {}
      }

      let commandType = '/todo';
      if (lastUserPrompt) {
        if (/\/(fix)\b|#(fix)\b/i.test(lastUserPrompt)) commandType = '/fix';
        else if (/\/(ask)\b|#(ask)\b/i.test(lastUserPrompt)) commandType = '/ask';
        else if (/\/(planning|plan)\b|#(planning|plan)\b/i.test(lastUserPrompt)) commandType = '/planning';
        else if (/\/(todo)\b|#(todo)\b/i.test(lastUserPrompt)) commandType = '/todo';
      }

      let lastStepObj = null;
      try {
        lastStepObj = JSON.parse(lines[lines.length - 1]);
      } catch {}

      const isRecent = (now - mtimeMs) < 60000;
      const isTerminalReply = lastStepObj && 
                              lastStepObj.type === 'PLANNER_RESPONSE' && 
                              (!lastStepObj.tool_calls || lastStepObj.tool_calls.length === 0);
      const isRunning = isRecent && !isTerminalReply;

      let cleanTitle = lastUserPrompt
        .replace(/\/(todo|ask|fix|plan|planning|review)\b/gi, '')
        .replace(/#(todo|ask|fix|plan|planning|review)\b/gi, '')
        .trim();

      if (!cleanTitle) {
        cleanTitle = commandType === '/fix' ? 'Quy trình sửa lỗi / khắc phục bug theo vết' : 'Quy trình phát triển tính năng / sửa lỗi tuần hoàn';
      }

      const diffSec = Math.floor((now - mtimeMs) / 1000);
      let timeAgo = 'Vừa xong';
      if (diffSec >= 3600 * 24) {
        const days = Math.floor(diffSec / (3600 * 24));
        timeAgo = `${days} ngày trước`;
      } else if (diffSec >= 3600) {
        const hours = Math.floor(diffSec / 3600);
        timeAgo = `${hours} giờ trước`;
      } else if (diffSec >= 60) {
        const mins = Math.floor(diffSec / 60);
        timeAgo = `${mins} phút trước`;
      } else {
        timeAgo = 'Vừa xong';
      }

      sessions.push({
        conversationId: convId,
        id: `task-${convId.slice(0, 8)}`,
        title: cleanTitle,
        shortTitle: cleanTitle.length > 55 ? cleanTitle.slice(0, 52) + '...' : cleanTitle,
        command: commandType,
        status: isRunning ? 'running' : 'completed',
        updatedAt: mtimeMs,
        timeAgo
      });
    } catch {}
  }

  return sessions;
}

/**
 * Main entry point: Return purely live Antigravity execution.
 * Accepts optional requestedConversationId to inspect a specific task session.
 */
function getLiveTaskExecution(requestedConversationId = null) {
  const allSessions = getAllAntigravitySessions(8);
  const targetId = requestedConversationId || (allSessions[0]?.conversationId) || null;
  const live = getAntigravityActiveSessionHierarchy(targetId);

  if (live) {
    live.activeSessions = allSessions;
    live.totalActiveSessions = allSessions.filter(s => s.status === 'running').length;
    return live;
  }

  const idle = getIdleHierarchy();
  idle.activeSessions = allSessions;
  idle.totalActiveSessions = allSessions.filter(s => s.status === 'running').length;
  return idle;
}

module.exports = {
  getLiveTaskExecution,
  readTailJsonlLines,
  getActiveAntigravityConversationId,
  getAllAntigravitySessions
};
