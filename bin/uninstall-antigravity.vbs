' Brakthroonam Router - 1-Click Elevated Launcher for Antigravity MITM Uninstall
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(currentDir)
uninstallScript = fso.BuildPath(currentDir, "uninstall-mitm.js")

nodeExe = "C:\nvm4w\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = "node.exe"
End If

Set UAC = CreateObject("Shell.Application")
UAC.ShellExecute nodeExe, """" & uninstallScript & """", projectDir, "runas", 1
