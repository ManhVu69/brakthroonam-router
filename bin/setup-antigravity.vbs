' Brakthroonam Router - 1-Click Elevated Launcher for Antigravity MITM Setup
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(currentDir)
setupScript = fso.BuildPath(currentDir, "setup-mitm.js")

nodeExe = "C:\nvm4w\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = "node.exe"
End If

Set UAC = CreateObject("Shell.Application")
' Kich hoat truc tiep Node.js setup script voi quyen Administrator (UAC Dialog se hien thi ngay tren Desktop)
UAC.ShellExecute nodeExe, """" & setupScript & """", projectDir, "runas", 1
