macroScript kmukarnas
	category:"3Ddizayn"
	buttonText:"Köse Mukarnas"
	toolTip:"Köse Mukarnas 2022"
(
	global kmukarnas
	if kmukarnas == undefined or not kmukarnas.open do
		fileIn "c:\muk3dd\23-v1.ms"
)