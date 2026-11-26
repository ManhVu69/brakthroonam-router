' Brakthroonam Router PRO - Silent Background Launcher
' Starts AI Router silently without any console window or popup browser

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' Verify if AI Router is already running on port 20129
Dim oExec, sOutput
Set oExec = WshShell.Exec("cmd /c netstat -ano | findstr /R "":20129.*LISTENING""")
sOutput = oExec.StdOut.ReadAll()

If InStr(sOutput, "LISTENING") = 0 Then
    ' Start silently (0 = hide window, False = non-blocking)
    WshShell.Run "cmd /c node bin\cli.js --port 20129 --no-browser", 0, False
End If

Set oExec = Nothing
Set fso = Nothing
Set WshShell = Nothing
