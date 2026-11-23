' Brakthroonam Router - Protocol Handler Dispatcher
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(currentDir)

nodeExe = "C:\nvm4w\nodejs\node.exe"
If Not fso.FileExists(nodeExe) Then
  nodeExe = "node.exe"
End If

uri = ""
If WScript.Arguments.Count > 0 Then
  uri = WScript.Arguments(0)
End If

targetScript = "setup-mitm.js"
If InStr(LCase(uri), "uninstall") > 0 Then
  targetScript = "uninstall-mitm.js"
End If

scriptPath = fso.BuildPath(currentDir, targetScript)

Set UAC = CreateObject("Shell.Application")
UAC.ShellExecute nodeExe, """" & scriptPath & """", projectDir, "runas", 1
