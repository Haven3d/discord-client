Set WshShell = CreateObject("WScript.Shell")
' Define o diretório atual para a pasta do script
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Roda o Node.js de forma 100% invisível (parâmetro 0)
WshShell.Run "cmd /c node PainelServidor.js", 0, False
