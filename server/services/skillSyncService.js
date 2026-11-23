const fs = require('fs');
const path = require('path');
const os = require('os');

const GLOBAL_SKILLS_DIR = path.join(os.homedir(), '.gemini', 'config', 'skills');
const AGENT_ROLES_PATH = path.join(os.homedir(), '.gemini', 'antigravity', 'combos.json');

function getDefaultRolesAndPolicy() {
  return {
    planner: {
      id: 'planner',
      name: 'Architect Planner (Lên Kế Hoạch & Phân Tích)',
      primaryModel: 'gemini-3.8-flash-high',
      fallbackChain: ['gemini-3.8-flash-high', 'gemini-3.8-flash', 'gemini-3.8-flash-medium'],
      description: 'Phân tích yêu cầu, bóc tách luồng dữ liệu, lập task list kiến trúc và phân tích Tư Duy Ngược'
    },
    coder: {
      id: 'coder',
      name: 'Lead Coder (Sinh Mã Nguồn)',
      primaryModel: 'gemini-3.8-flash-high',
      fallbackChain: ['gemini-3.8-flash-high', 'gemini-3.8-flash', 'gemini-3.8-flash-medium'],
      description: 'Sinh mã nguồn tuân thủ Feature-Sliced / 5-Layer và design system'
    },
    tester: {
      id: 'tester',
      name: 'Automated Tester (Kiểm Thử)',
      primaryModel: 'gemini-3.8-flash',
      fallbackChain: ['gemini-3.8-flash-high', 'gemini-3.8-flash', 'gemini-3.8-flash-medium'],
      description: 'Chạy kiểm thử tự động, linter và sửa lỗi biên dịch phát sinh'
    },
    review_functional: {
      id: 'review_functional',
      name: 'Reviewer 1 — Chức Năng & Nghiệp Vụ',
      primaryModel: 'gemini-3.8-flash-high',
      fallbackChain: ['gemini-3.8-flash-high', 'gemini-3.8-flash'],
      description: 'Đối chiếu mã nguồn với yêu cầu bài toán: chức năng đã đạt mục tiêu chưa'
    },
    review_architecture: {
      id: 'review_architecture',
      name: 'Reviewer 2 — Kiến Trúc & Clean Code',
      primaryModel: 'gemini-3.8-flash-high',
      fallbackChain: ['gemini-3.8-flash-high', 'gemini-3.8-flash'],
      description: 'Kiểm tra phân lập tầng kiến trúc, Cognitive Complexity <= 30'
    },
    review_security: {
      id: 'review_security',
      name: 'Reviewer 3 — Bảo Mật OWASP & SonarLint',
      primaryModel: 'gemini-3.8-flash-high',
      fallbackChain: ['gemini-3.8-flash-high', 'gemini-3.8-flash-medium'],
      description: 'Thẩm định lỗ hổng bảo mật: SQL Injection, IDOR, rò rỉ token, sanitize input'
    },
    ask: {
      id: 'ask',
      name: 'Principal Advisor (Cố Vấn Kỹ Thuật Trưởng & Multi-Persona)',
      primaryModel: 'gemini-3.8-flash-high',
      fallbackChain: ['gemini-3.8-flash-high', 'o3-mini', 'gpt-4o', 'gemini-3.8-flash', 'gemini-2.5-pro'],
      description: 'Tư vấn kỹ thuật chuyên sâu, tranh luận 4 góc nhìn chuyên gia (Systems, Strategy, Scalability, Risk), Read-only'
    },
    pipelinePolicy: {
      requirePlanApproval: true,
      autoFixLoop: true,
      maxLoopRetries: 3,
      circuitBreakerOn4th: true,
      circuitBreakerAction: 'stop_and_report_rca',
      reviewersCount: 3,
      askMultiPersona: true,
      planningAutoSave: true,
      planningModel: 'gemini-3.8-flash-high',
      askModel: 'gemini-3.8-flash-high'
    }
  };
}

function loadRoles() {
  try {
    if (fs.existsSync(AGENT_ROLES_PATH)) {
      const data = JSON.parse(fs.readFileSync(AGENT_ROLES_PATH, 'utf8'));
      const defaults = getDefaultRolesAndPolicy();
      return {
        ...defaults,
        ...data,
        pipelinePolicy: {
          ...defaults.pipelinePolicy,
          ...(data.pipelinePolicy || {})
        }
      };
    }
  } catch (err) {}
  return getDefaultRolesAndPolicy();
}

function syncAllGlobalSkills(rolesInput = null) {
  const roles = rolesInput || loadRoles();
  const policy = roles.pipelinePolicy || {};
  const maxRetries = policy.maxLoopRetries || 3;
  const requireApproval = policy.requirePlanApproval !== false;
  const plannerModel = roles.planner?.primaryModel || 'gemini-3.8-flash-high';
  const coderModel = roles.coder?.primaryModel || 'gemini-3.8-flash-high';
  const testerModel = roles.tester?.primaryModel || 'gemini-3.8-flash';
  const planningModel = policy.planningModel || plannerModel;
  const askModel = policy.askModel || roles.ask?.primaryModel || plannerModel;

  fs.mkdirSync(GLOBAL_SKILLS_DIR, { recursive: true });

  // 1. Skill /todo
  const todoDir = path.join(GLOBAL_SKILLS_DIR, 'todo');
  fs.mkdirSync(todoDir, { recursive: true });
  const todoContent = `---
name: todo
description: "Quy trình phát triển tính năng / sửa lỗi tuần hoàn khép kín do Brakthroonam Router điều phối (Lập Kế Hoạch -> Chờ Xác Nhận Duyệt -> Vòng lặp [Code -> Test -> Review] lặp tối đa ${maxRetries} lần -> Chốt ngắt mạch lần thứ ${maxRetries + 1} báo cáo RCA). Kích hoạt khi người dùng gõ /todo hoặc #todo."
user-invocable: true
---

# Todo Pipeline Workflow (Orchestrated by Brakthroonam Router)

Quy trình phát triển tính năng hoặc sửa lỗi chuẩn hóa được điều phối tập trung từ Brakthroonam Router:

## 1. Pha 1 — Lập Kế Hoạch & Trình Bày Chi Tiết (Planning & Full Plan Presentation)
- Kế thừa mô hình Architect Planner được cấu hình trong Brakthroonam Router: \`${plannerModel}\`.
- Phân tích yêu cầu, bóc tách luồng dữ liệu, lập task list kiến trúc và phân tích **Tư Duy Ngược (Devil's Advocate & Pre-Mortem)** (3 câu hỏi: Giả định sai, Kịch bản sập production, Giải pháp tối giản KISS/YAGNI).
- **QUY ĐỊNH BẮT BUỘC VỀ TÍNH MINH BẠCH KẾ HOẠCH (PLAN TRANSPARENCY MANDATE):**
  + **BẮT BUỘC IN TOÀN BỘ BẢN KẾ HOẠCH CHI TIẾT** ra phản hồi văn bản (Markdown) cho người dùng trước khi yêu cầu duyệt.
  + Bản kế hoạch chi tiết bắt buộc gồm 5 mục chuẩn hóa:
    1. **Mục Tiêu & Ranh Giới (Scope):** In-scope (những việc cụ thể sẽ làm) và Out-of-scope (những việc không làm để tránh lan man).
    2. **Danh Mục Tệp Tin & Vị Trí Sửa Đổi Cụ Thể (File Breakdown):** Liệt kê rõ đường dẫn file kèm chi tiết sửa hàm nào, đổi text gì, thêm logic nào.
    3. **Thiết Kế Luồng Xử Lý & Kiến Trúc (Architecture & Data Flow):** Mô tả luồng dữ liệu trước và sau khi thay đổi.
    4. **Góc Phản Biện Tư Duy Ngược (Devil's Advocate):** Phân tích giả định sai, kịch bản lỗi phát sinh và phương án tối giản KISS/YAGNI.
    5. **Kịch Bản Kiểm Thử & Tiêu Chí Nghiệm Thu (Verification Matrix):** Lệnh kiểm thử tự động, build suite và tiêu chí xác nhận hoàn tất.
  + **TUYỆT ĐỐI CẤM:** Không được chỉ gọi mỗi công cụ \`ask_question\` với popup trắc nghiệm 1 2 3 cụt lủn mà không trình bày kế hoạch chi tiết! Người dùng phải nắm rõ phương án kỹ thuật thì mới có cơ sở để duyệt.

## 2. Pha 2 — Cổng Duyệt Thông Minh (Adaptive Approval Gate)
- **Cơ chế phân loại rủi ro tác vụ:**
  + **Rủi Ro Cao (High Risk):** Tác động Database Schema, Auth/Bảo mật, Payment, API Schema, Routing Gateway core, xóa/di chuyển file cấu trúc $\rightarrow$ Sau khi xuất bản Kế Hoạch Chi Tiết ở Pha 1, **BẮT BUỘC DỪNG LẠI** và gọi công cụ \`ask_question\` để người dùng xác nhận duyệt kế hoạch trước khi code. Trong câu hỏi, tóm tắt rõ phương án cốt lõi (2-3 dòng) dẫn chiếu tới kế hoạch chi tiết phía trên; các lựa chọn options phải có ý nghĩa hành động rõ ràng. Tuyệt đối KHÔNG tự ý nhảy cóc sang viết code khi chưa nhận được xác nhận từ người dùng.
  + **Rủi Ro Thấp (Low Risk / Auto-Approve):** Tinh chỉnh giao diện (UI/CSS/Styling), bố cục hiển thị, icons, responsive, văn bản/nhãn text, tài liệu docs/comments mà không đụng chạm đến contracts dữ liệu $\rightarrow$ Vẫn bắt buộc xuất bản Kế Hoạch Chi Tiết ở Pha 1 để người dùng theo dõi, sau đó **Tự Động Thông Qua (Auto-Approved)** chuyển sang Pha 3 (Lead Coder) nhằm triệt tiêu tối đa ma sát cho người dùng.
  + **Tùy chọn can thiệp:** Dù ở mức rủi ro nào, nếu người dùng muốn sửa đổi phương án thì Brakthroonam Router luôn hỗ trợ gọi \`/planning\` để tái thiết kế mà không phá vỡ codebase.

## 3. Pha 3 — Vòng Tuần Hoàn Khép Kín: Code -> Test -> Review (Lặp Tối Đa ${maxRetries} Lần)
Khởi tạo biến đếm chu trình: \`vòng_lặp = 1\` (chạy từ 1 đến ${maxRetries}):
1. **Code:** Triển khai mã nguồn tuân thủ kiến trúc dự án với mô hình Lead Coder: \`${coderModel}\`.
2. **Test:** Chạy kiểm thử tự động (linter, compiler, unit test) với mô hình Automated Tester: \`${testerModel}\`.
   - Nếu test PASS: Chuyển sang khâu Review.
   - Nếu test FAIL: Ghi nhận bug và chuyển sang bước kiểm tra rẽ nhánh bên dưới.
3. **Review:** Thẩm định song song với 3 Reviewers (Functional/UX, Architecture, Security & SonarLint).
   - Nếu Reviewer PASS: Đủ điều kiện hoàn tất tác vụ.
   - Nếu Reviewer phát hiện bug / reject: Ghi nhận bug và chuyển sang bước kiểm tra rẽ nhánh bên dưới.
4. **Điều Kiện Rẽ Nhánh & Giới Hạn Lặp:**
   - Khi phát hiện bug ở Test hoặc Review:
     + **Nếu \`vòng_lặp < ${maxRetries}\`:** Tăng \`vòng_lặp = vòng_lặp + 1\`. Tự động quay lại khâu **Code** để sửa lỗi và chạy lại Test/Review.
     + **Nếu đến lần thứ ${maxRetries + 1} (Sau ${maxRetries} lần sửa vẫn còn bug):** **BẮT BUỘC DỪNG TOÀN BỘ PIPELINE NGAY LẬP TỨC (CIRCUIT BREAKER)**. Tuyệt đối không lặp tiếp gây tốn token vô ích.

## 4. Pha 4 — Cơ Chế Ngắt Mạch Lần Thứ ${maxRetries + 1} (Root Cause Analysis & Giải Pháp)
Khi dừng lại do Circuit Breaker ở lần thứ ${maxRetries + 1}, Agent phải ngồi lại phân tích và xuất báo cáo 3 phần cho người dùng:
1. **Mô tả chi tiết bug:** Lỗi cụ thể là gì, file/dòng nào bị ảnh hưởng, stack trace / log lỗi.
2. **Nguyên nhân gốc rễ (Root Cause Analysis - RCA):** Phân tích rõ tại sao qua ${maxRetries} lần sửa vẫn không thể fix được (xung đột kiến trúc, lỗi thư viện bên ngoài, hạn chế API hay logic mâu thuẫn...).
3. **Bảng ma trận giải pháp:** Đưa ra 2–3 phương án xử lý khả thi (Option 1, 2, 3) kèm ưu/nhược điểm và rủi ro để người dùng cùng ngồi lại quyết định.
`;
  fs.writeFileSync(path.join(todoDir, 'SKILL.md'), todoContent, 'utf8');

  // 2. Skill /fix
  const fixDir = path.join(GLOBAL_SKILLS_DIR, 'fix');
  fs.mkdirSync(fixDir, { recursive: true });
  const fixContent = `---
name: fix
description: "Quy trình sửa lỗi / khắc phục bug theo vết do Brakthroonam Router điều phối (Bỏ qua khâu lên plan mới, đi thẳng vào vòng lặp Code -> Test -> Review dựa trên nguyên nhân/kế hoạch đã có trước đó, lặp tối đa ${maxRetries} lần -> Chốt ngắt mạch lần thứ ${maxRetries + 1} báo cáo RCA). Kích hoạt khi người dùng gõ /fix hoặc #fix."
user-invocable: true
---

# Fix Workflow — Targeted Bug Fix & Verification Loop (Orchestrated by Brakthroonam Router)

Quy trình sửa lỗi nhanh chuyên sâu khi **ĐÃ CÓ SẴN** phân tích nguyên nhân (Root Cause Analysis), log lỗi, hoặc kế hoạch khắc phục từ trước:

## 1. Điều Kiện Tiên Quyết (Pre-Conditions)
- Lệnh \`/fix\` hoặc \`#fix\` **bỏ qua bước lập kế hoạch từ đầu** và **bỏ qua cổng duyệt kế hoạch** để tập trung sửa lỗi tức thì.
- **Yêu cầu đầu vào:** Người dùng hoặc phiên làm việc trước đó phải cung cấp ngữ cảnh lỗi (thông điệp lỗi, log console, stack trace, hoặc kết quả phân tích từ \`/ask\`).

## 2. Vòng Tuần Hoàn Sửa Lỗi: Code -> Test -> Review (Lặp Tối Đa ${maxRetries} Lần)
Khởi tạo biến đếm chu trình: \`vòng_lặp = 1\` (chạy từ 1 đến ${maxRetries}):

1. **Code (Sửa Lỗi Đúng Trọng Tâm):**
   - Sử dụng mô hình Lead Coder: \`${coderModel}\`.
   - Chỉ sửa đổi chính xác các vị trí phát sinh bug theo nguyên nhân đã xác định, không lan man sang các tính năng khác làm tăng rủi ro regression.
2. **Test (Kiểm Thử Khắc Phục):**
   - Chạy lệnh test/build dự án (\`npm run lint && npm run build\` hoặc \`mvnw.cmd test\`) với mô hình Automated Tester: \`${testerModel}\`.
   - Nếu test FAIL: Ghi nhận lỗi và quay lại khâu Code.
3. **Review (Thẩm Định Mã Nguồn Sửa Đổi):**
   - Reviewer thẩm định tập trung: Mã sửa đổi có khắc phục triệt để nguyên nhân gốc rễ không? Có làm phát sinh bug mới ở các luồng liên quan không?
   - Nếu Reviewer PASS: Đủ điều kiện hoàn tất tác vụ.
   - Nếu Reviewer phát hiện bug còn tồn đọng: Ghi nhận lỗi và chuyển sang kiểm tra rẽ nhánh bên dưới.

## 3. Điều Kiện Rẽ Nhánh & Ngắt Mạch Lần Thứ ${maxRetries + 1} (Circuit Breaker)
- Nếu phát hiện bug trong quá trình sửa:
  + **Nếu \`vòng_lặp < ${maxRetries}\`:** Tăng \`vòng_lặp = vòng_lặp + 1\`. Tự động quay lại khâu **Code** để chỉnh sửa tiếp và chạy lại Test/Review.
  + **Nếu đến lần thứ ${maxRetries + 1} (Sau ${maxRetries} lần thử sửa vẫn thất bại):** **BẮT BUỘC DỪNG TOÀN BỘ TIẾN TRÌNH NGAY LẬP TỨC**. Tuyệt đối cấm lặp tiếp ngầm làm phá vỡ codebase.

## 4. Báo Cáo Giải Trình Khi Ngắt Mạch Lần Thứ ${maxRetries + 1}
Agent dừng lại, không sửa tiếp, và xuất báo cáo 3 phần:
1. **Hiện trạng lỗi còn lại:** Chi tiết hành vi sai khác hoặc stack trace.
2. **Phân tích vì sao 3 lần sửa vẫn thất bại (RCA):** Chỉ ra nguyên nhân sâu xa (giả định sai, bug trong core framework, xung đột phiên bản package...).
3. **Đề xuất 2–3 phương án:** Đổi cách tiếp cận, thay thế thư viện, hoặc rollback để cùng người dùng thống nhất giải pháp.
`;
  fs.writeFileSync(path.join(fixDir, 'SKILL.md'), fixContent, 'utf8');

  // 3. Skill /planning
  const planningDir = path.join(GLOBAL_SKILLS_DIR, 'planning');
  fs.mkdirSync(planningDir, { recursive: true });
  const planningContent = `---
name: planning
description: "Quy trình thiết kế kiến trúc và lập kế hoạch chuyên sâu do Brakthroonam Router điều phối (Chỉ gọi model Architect Planner, bóc tách luồng dữ liệu, phân tích Tư Duy Ngược Devil's Advocate, và dừng lại lưu Plan, KHÔNG viết code). Kích hoạt khi người dùng gõ /planning hoặc #planning."
user-invocable: true
---

# Planning Workflow — Deep Architecture & Task Breakdown (Orchestrated by Brakthroonam Router)

Quy trình thuần túy nghiên cứu, bóc tách và thiết lập kế hoạch hành động chi tiết trước khi tiến hành viết code:

## 1. Mô Hình Điều Phối (Model Assignment)
- Kế thừa trực tiếp mô hình chuyên gia suy luận sâu được cấu hình tại Brakthroonam Router: \`${planningModel}\` (Virtual Combo: \`combo-plan\`).
- Ưu tiên năng lực phân tích logic, bao quát toàn cục hệ thống và tìm kiếm điểm mù kiến trúc.

## 2. Cấu Trúc Bản Kế Hoạch Chuẩn Hóa
Bản kế hoạch do \`/planning\` sinh ra bắt buộc bao gồm:
1. **Mục Tiêu & Tiêu Chí Nghiệm Thu (Acceptance Criteria):** Ranh giới In-scope (làm gì) và Out-of-scope (dứt khoát không làm gì).
2. **Thiết Kế Phân Tầng Kiến Trúc:**
   - Với Frontend: Phân bổ các tầng FSA (\`app/\`, \`core/\`, \`shared/\`, \`features/<slice>/\`).
   - Với Backend: Phân bổ 5 tầng (\`Controller\`, \`Service\`, \`Processor\`, \`Repository\`, \`Entity/DTO\`).
3. **Danh Mục Tệp Tin Dự Kiến:** File nào tạo mới, file nào chỉnh sửa, vai trò cụ thể của từng file.
4. **🧠 Góc Phản Biện Ngược (Devil's Advocate & Pre-Mortem) — Bắt Buộc:**
   - *Giả định nào có thể sai?* (Về dữ liệu rỗng, concurrency, network timeout...).
   - *Nếu hệ thống sập trên production thì nguyên nhân là gì?* (Memory leak, deadlock, N+1 query, vỡ layout responsive...).
   - *Có giải pháp nào tối giản hơn (KISS / YAGNI) không?*
5. **Kịch Bản Kiểm Thử & Kiểm Soát Rủi Ro:** Các ca kiểm thử tự động cần chạy để xác nhận tính năng hoàn tất.

## 3. Ràng Buộc Bất Biến (Non-Negotiable Constraints)
- **CHỈ LẬP KẾ HOẠCH, TUYỆT ĐỐI KHÔNG VIẾT CODE:** Sau khi hoàn thiện bản kế hoạch, Agent dừng lại, lưu trữ kế hoạch dưới dạng file Artifact hoặc tài liệu markdown trong thư mục \`plans/\` hoặc \`docs/\`.
- Để tiến hành viết code theo kế hoạch này, người dùng sẽ kích hoạt lệnh \`/todo\` (để chạy có duyệt) hoặc \`/fix\` (để sửa theo plan).
`;
  fs.writeFileSync(path.join(planningDir, 'SKILL.md'), planningContent, 'utf8');

  // 4. Skill /ask
  const askDir = path.join(GLOBAL_SKILLS_DIR, 'ask');
  fs.mkdirSync(askDir, { recursive: true });
  const askContent = `---
name: ask
description: "Tư vấn kỹ thuật và kiến trúc đa chiều do Brakthroonam Router điều phối (Phân tích bối cảnh, tranh luận qua 4 chuyên gia: Systems Designer, Technology Strategist, Scalability Consultant, Risk Analyst, tuyệt đối không sửa code). Kích hoạt khi người dùng gõ /ask hoặc #ask."
user-invocable: true
---

# Technical Consultation — Multi-Perspective Architectural Analysis (Orchestrated by Brakthroonam Router)

Tư vấn chiến lược công nghệ và kiến trúc hệ thống chuyên sâu, tuân thủ bộ ba nguyên tắc **YAGNI**, **KISS**, và **DRY**:

## 1. Mô Hình Điều Phối (Model Routing)
- Kế thừa mô hình suy luận logic cao nhất được chỉ định trong Brakthroonam Router: \`${askModel}\` (Virtual Combo: \`combo-ask\`).
- Áp dụng kỹ thuật **Internal Mixture-of-Personas Prompting**: Mô hình nhập vai 4 chuyên gia kiến trúc hàng đầu để tranh luận và đưa ra kết luận mạch lạc trong cùng một luồng suy luận.

## 2. Bốn Vai Trò Chuyên Gia Phản Biện (4 Core Personas)
1. **Systems Designer (Kiến Trúc Sư Hệ Thống):** Đánh giá ranh giới mô-đun, interfaces, phân lập tầng, luồng dữ liệu (Data Flow) và tính toàn vẹn của hệ thống.
2. **Technology Strategist (Chiến Lược Gia Công Nghệ):** Đánh giá việc lựa chọn framework, thư viện, mô hình dữ liệu và các tiêu chuẩn tốt nhất trong ngành (Industry Best Practices).
3. **Scalability Consultant (Chuyên Gia Mở Rộng & Hiệu Năng):** Đánh giá hiệu năng chịu tải, quản lý tài nguyên, bộ nhớ đệm (Caching), concurrency và khả năng mở rộng khi lượng truy cập tăng đột biến.
4. **Risk Analyst (Chuyên Gia Phân Tích Rủi Ro & Bảo Mật):** Tìm kiếm các điểm yếu bảo mật (OWASP), bẫy kỹ thuật (Technical Debt), các giả định ngầm sai lầm và kịch bản thảm họa có thể xảy ra.

## 3. Định Dạng Đầu Ra Bắt Buộc (Structured Output Format)
Mọi phản hồi từ \`/ask\` phải ngắn gọn, sắc bén, thẳng thắn và gồm 5 phần:
1. **Architecture Analysis:** Tóm tắt bản chất bài toán và thách thức cốt lõi.
2. **Design Recommendations:** Các phương án kiến trúc đề xuất kèm lý do lựa chọn.
3. **Technology Guidance:** So sánh ưu/nhược điểm các công nghệ hoặc cách tiếp cận khả thi.
4. **Implementation Strategy:** Lộ trình triển khai từng bước và các mốc kiểm chứng.
5. **Next Actions:** Hành động cụ thể tiếp theo người dùng nên thực hiện.

## 4. Ràng Buộc Tuyệt Đối
- **CHẾ ĐỘ READ-ONLY:** Lệnh \`/ask\` chỉ dành cho phân tích, nghiên cứu và tư vấn; **TUYỆT ĐỐI CẤM SỬA ĐỔI HOẶC TẠO MỚI MÃ NGUỒN**.
`;
  fs.writeFileSync(path.join(askDir, 'SKILL.md'), askContent, 'utf8');

  return {
    success: true,
    syncedSkills: ['todo', 'fix', 'planning', 'ask'],
    globalPath: GLOBAL_SKILLS_DIR,
    timestamp: new Date().toISOString()
  };
}

function getGlobalSkillsStatus() {
  const skills = ['todo', 'fix', 'planning', 'ask'];
  const status = {};
  for (const s of skills) {
    const skillFile = path.join(GLOBAL_SKILLS_DIR, s, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      const stat = fs.statSync(skillFile);
      status[s] = {
        installed: true,
        mtime: stat.mtimeMs,
        path: skillFile
      };
    } else {
      status[s] = {
        installed: false,
        path: skillFile
      };
    }
  }
  return {
    globalSkillsDir: GLOBAL_SKILLS_DIR,
    status
  };
}

function initGlobalSkillsOnStartup() {
  try {
    const roles = loadRoles();
    syncAllGlobalSkills(roles);
    console.log(`[Global Skills] Đã đồng bộ 4 Global Skills (/todo, /fix, /planning, /ask) tại ${GLOBAL_SKILLS_DIR}`);
  } catch (err) {
    console.error('[Global Skills] Lỗi khởi tạo Global Skills:', err.message);
  }
}

module.exports = {
  GLOBAL_SKILLS_DIR,
  AGENT_ROLES_PATH,
  getDefaultRolesAndPolicy,
  loadRoles,
  syncAllGlobalSkills,
  getGlobalSkillsStatus,
  initGlobalSkillsOnStartup
};
