rollout kmukarnas "Köse Mukarnas - Hassa 2022 - ver 1" width:350 height:360
(
	fn filtre obj=(classof obj == splineshape) or (classof obj == simple_spline) or (classof obj == line)
	global icdizi, ickopya, derinlikhesap, noktalar, yuzey, noktalar2, yuzey2, obj, kopya, dizi=1, say=0, sayh=0, saya=0, 
	knotCount, a, vert1, p1, p2, p3, asa, p1p2mesafe =1, asaba_adet, asaba_h, pp1arka,pp1, pp2, pp2h,pp3, pp3h,pp3kopyafark,pp7,pp8,pp9,pp10
	bitmap 'bmp1' "Bitmap" pos:[10,10] width:200 height:320 fileName:"c:\\muk3dd\\foto\\tablo2.jpg" align:#left
	label 'lbl1' "Açiklama :" pos:[10,337] width:54 height:17 align:#left
	label 'lbl2' "" pos:[62,337] width:177 height:15 align:#left
	pickbutton 'btn1' "Plan Seç ( shape )" pos:[220,10] width:120 height:39 align:#left filter:filtre
	spinner 'asaba_adedi' "Asaba adedi: " pos:[221,218] width:65 height:16 enabled:false range:[1,50,0] type:#integer fieldwidth:35 align:#left
	button 'btn2' "P1 ( vertex ) seç" pos:[220,57] width:120 height:30 enabled:false align:#left
	label 'not1' "Yapilacak islem :" pos:[220,128] width:120 height:46 enabled:true align:#left
	label 'not2' "Bitmis islem :" pos:[220,174] width:120 height:40 enabled:true align:#left
	spinner 'asaba_toplam_h' "H : ............" pos:[221,258] width:77 height:16 enabled:false range:[0.1,999,0] type:#float fieldwidth:35 align:#left
	spinner 'derinlik' "Derinlik : ......" pos:[220,279] width:60 height:16 enabled:false range:[0,100,0] type:#float align:#left
	spinner 'asaba_yuksekligi' "Asaba h : ...." pos:[221,238] width:67 height:16 enabled:false range:[0.1,500,0] type:#float fieldwidth:35 align:#left
	spinner 'x_mesafesi' "x ölçüsü :" pos:[240,300] width:66 height:16 enabled:false range:[0.1,500,0] type:#float fieldwidth:35 align:#left
	checkbox 'chk1' "Checkbox" pos:[221,302] width:11 height:12 enabled:false align:#left
	label 'not3' "x ölçüsü : " pos:[240,337] width:107 height:15 enabled:false align:#left
	button 'okk' "Çiz" pos:[220,96] width:118 height:31 enabled:false align:#left

	fn yan =
	(
		derinlikhesap = (sqrt((derinlik.value*derinlik.value)/2))			
		pp7 = [pp3h.x-derinlikhesap,pp3h.y-derinlikhesap,pp3h.z+(asaba_h*asaba_adet)]
		pp8 = [pp1.x-derinlikhesap,pp1.y-derinlikhesap,pp1.z+(asaba_h*asaba_adet)]
		
		pp9 = [pp2h.x+derinlikhesap,pp2h.y-derinlikhesap,pp2h.z+(asaba_h*asaba_adet)]
		pp10 = [pp1.x+derinlikhesap,pp1.y-derinlikhesap,pp1.z+(asaba_h*asaba_adet)]
		
		pp11 = [pp1.x,pp1.y-(derinlikhesap*2),pp1.z+(asaba_h*asaba_adet)]
		
		noktalar2 = #([pp1.x,pp1.y,pp1.z+(asaba_h*asaba_adet)],[pp2.x,pp2.y,pp2.z+(asaba_h*(asaba_adet-1))],[pp3.x,pp3.y,pp3.z+(asaba_h*(asaba_adet-1))],
							[pp2h.x,pp2h.y,pp2h.z+(asaba_h*asaba_adet)],[pp3h.x,pp3h.y,pp3h.z+(asaba_h*asaba_adet)],pp1arka,pp7,pp8,pp9,pp10,pp11) 
		yuzey2 = #([7,5,1],[8,7,1])
		yuzey3 = #([4,9,1],[10,1,9])
		yuzey4 = #([8,1,11],[10,11,1])
							
		mesh prefix:"yanak"  vertices:noktalar2 faces:yuzey2  isselected:false wirecolor:(color 150 200 100)
		mesh prefix:"yyanak"  vertices:noktalar2 faces:yuzey3  isselected:false wirecolor:(color 150 200 100)
		mesh prefix:"yyyanak"  vertices:noktalar2 faces:yuzey4  isselected:false wirecolor:(color 150 200 100)	
				
		select $yanak*
		meshop.extrudeedges $ #{1} asaba_h
		addModifier $ (smooth())
		addModifier $ (optimize ())
		$.modifiers[#optimize].autoedge = on	
		select $yyanak*
		meshop.extrudeedges $ #{1} asaba_h
		addModifier $ (smooth())
		addModifier $ (optimize ())
		$.modifiers[#optimize].autoedge = on	
		select $yanak*
	
		if derinlik.value == 0 then
		(
			delete $yanak*
			delete $yyanak*
			delete $yyyanak*
		)
		else
		(
		if asaba_adet > 1 then 
			(
			for dizi = 1 to asaba_adet-1  do
				(
				kopyakenar = instance $
				kopyakenar.wirecolor=color 150 200 100
				kopyakenar.pos = [(-pp3kopyafark*dizi),(pp3kopyafark*dizi),(-asaba_h*dizi)]
				)
			select $yyanak*
			for dizi = 1 to asaba_adet-1  do
				(
				kopyakenar2 = instance $
				kopyakenar2.wirecolor=color 150 200 100
				kopyakenar2.pos = [(pp3kopyafark*dizi),(pp3kopyafark*dizi),(-asaba_h*dizi)]
				)
			)
			group $*nak* name:"yanak"
		)
	)
	
	fn ciz =
	(
			okk.enabled=false
			btn2.enabled=false	
		if okk.enabled==false and asaba_adet==1 and chk1.checked == false then
		(
				asaba_h = p1p2mesafe*1.618   ------------------------------------------- altin oran için 
				asaba_yuksekligi.value = p1p2mesafe*1.618   ------------------------ altin oran için 
				asaba_toplam_h.value = asaba_h*asaba_adet   --------------------- altin oran için
		)
	---------------------------------------- pp1 nin bulunmasi-------------------------------------
			pp1 = getknotpoint a 1 (1)
	---------------------------------------- pp2 nin bulunmasi-------------------------------------
			refinesegment a 1 1 (asa/p1p2mesafe)
			pp2 = getknotpoint a 1 (2)
			pp2h = pp2	
	---------------------------------------- pp3 ün bulunmasi-------------------------------------			
			refinesegment a 1 4 (1-(asa/p1p2mesafe))
  			pp3 = getknotpoint a 1 (5)
			pp3h = pp3	
			pp3kopyafark = (sqrt((asa*asa)/2))
			deleteknot a 1 2
			deleteknot a 1 4
	---------------------------------------- pp1arka bulunmasi-------------------------------------	
		pp1arka = pp1
		pp1arka = [pp1.x,(pp1.y+(pp3kopyafark*2)),pp3.z+(asaba_h*(asaba_adet-1))]

	  	noktalar = #([pp1.x,pp1.y,pp1.z+(asaba_h*asaba_adet)],[pp2.x,pp2.y,pp2.z+(asaba_h*(asaba_adet-1))],[pp3.x,pp3.y,pp3.z+(asaba_h*(asaba_adet-1))],
						[pp2h.x,pp2h.y,pp2h.z+(asaba_h*asaba_adet)],[pp3h.x,pp3h.y,pp3h.z+(asaba_h*asaba_adet)],pp1arka) 
		yuzey = #([1,3,2],[1,2,4],[1,5,3],[2,3,6])
		mesh prefix:"Köse_mukarnas"  vertices:noktalar faces:yuzey  isselected:true wirecolor:(color 100 200 100)
		
		--pp1.z	= 0

	if asaba_adet > 1 then 
		(
		for dizi = 1 to asaba_adet-1  do
		(
			kopya = instance $
			kopya.wirecolor=color 100 200 100
			kopya.pos = [(pp3kopyafark*dizi),(pp3kopyafark*dizi),(-asaba_h*dizi)]
			for icdizi = 1 to dizi  do
			(
				ickopya = instance $
				ickopya.wirecolor=color 100 200 100
				ickopya.pos = [((pp3kopyafark*dizi)-((pp3kopyafark*2)*icdizi)),(pp3kopyafark*dizi),-asaba_h*dizi]
				update $
			)
		)
	)
	group $Köse_mukarnas* name:"muk"
	addModifier $ (smooth())
	) 

	on kmukarnas open do
	(
	asaba_adedi.value =1
	asaba_toplam_h.value =0
	asaba_h =0
	asaba_yuksekligi.value = 0
	not1.text  = "Yapilacak islem : Çizilecek köse mukarnasin planini seçin"
	)
	on btn1 picked obj do -------------------------------------------------- Plan seçmek için
	(
		select obj
		converttosplineshape $
			knotCount = numknots obj
				if knotCount != 3 then
				(
					messageBox "Seçtiginiz Shape 3 vertexli degil"
					deselect obj
				)
				else		
						(
							not1.text  = "Yapilacak islem : Seçtiginiz Shape 'in P1 köse noktasini seçin"
							obj.wirecolor = [230,140,80]
							setCommandPanelTaskMode #modify
							subobjectlevel = 1
							lbl2.text  = obj.name+;"   Plan shape secildi"
							not2.text  = "Bitmis islem : Plan seçimi yapildi"
							btn1.enabled=false
							btn2.enabled=true
						)
	)
	on asaba_adedi changed val do  ---------------------------------- asaba adedi
	(
		saya=saya+1
		if saya >= 1 then delete $muk
		if derinlik.value != 0 then
		(
			delete $yanak*
			delete $yyanak*
			delete $yyyanak*
		)
		if asaba_adedi.value >= 1 and asaba_toplam_h.value == 0 then not2.text  = "Bitmis islem : Asaba toplam yüksekligi (H)  '0'  olamaz"
		if asaba_adedi.value >= 1 and asaba_toplam_h.value != 0 then 
			(
			not2.text  = "Bitmis islem : Asaba adedi belirlendi"
			btn2.enabled=false
			not1.text  = "Yapilacak islem : "
			)
			asaba_adet = asaba_adedi.value
			asaba_h = asaba_toplam_h.value/asaba_adedi.value
			asaba_yuksekligi.value = asaba_h
			not3.text = "x ölçüsü : " + (p1p2mesafe/asaba_adedi.value) as string
			
			if chk1.checked == false  then 
		(
			asa = p1p2mesafe/asaba_adet
		)
	---------------------------------------- pp1 nin bulunmasi-------------------------------------	
			pp1 = getknotpoint a 1 (1)
	---------------------------------------- pp2 nin bulunmasi-------------------------------------
			refinesegment a 1 1 (asa/p1p2mesafe)
			pp2 = getknotpoint a 1 (2)
	---------------------------------------- pp3 ün bulunmasi-------------------------------------			
			refinesegment a 1 4 (1-(asa/p1p2mesafe))
			pp3 = getknotpoint a 1 (5)
	---------------------------------------- pp1arka bulunmasi-------------------------------------	
		pp1arka = pp1
		pp1arka = [pp1.x,(pp1.y+(pp3kopyafark*2)),pp3.z+(asaba_h*(asaba_adet-1))]
			deleteknot a 1 2
			deleteknot a 1 4
	ciz() -------------------
	if derinlik.value != 0 then yan()
	)
	on btn2 pressed do -------------------------------------------------------- P1 noktasini seçmek için
	(
		a=selection[1]
		vert1 = getknotselection $ 1
		if vert1[1] == ()  then 
		(
			messageBox "P1 noktasini seçin"
		)
			else
			(
				splineOps.makeFirst a
			    updateshape a
				not1.text  = "Yapilacak islem : P1 noktasi belirleyebilir veya Çiz e basabilirsiniz. "
				not2.text  = "Bitmis islem : P1 ön köse noktasi seçildi"

				p1 = getknotpoint a 1 (1)
				p2 = getknotpoint a 1 (2)
				p3 = getknotpoint a 1 (3)
				p1p2mesafe = (distance p1 p2)
				asaba_adet = asaba_adedi.value
				x_mesafesi.value = p1p2mesafe
				asa = p1p2mesafe 
				not3.text = "x ölçüsü : " + (p1p2mesafe/asaba_adedi.value) as string
				not3.enabled=true
				okk.enabled=true
			)
	)
	on asaba_toplam_h changed val do  -------------------------------------------------------- toplam H için
	(	
		asaba_yuksekligi.value = asaba_toplam_h.value/asaba_adedi.value
		say=say+1
		if say >= 1 or asaba_yuksekligi.value !=0 then delete $muk
		if derinlik.value != 0 then
		(
			delete $yanak*
			delete $yyanak*
			delete $yyyanak*
		)
		if asaba_toplam_h.value != 0 and asaba_adedi.value >= 1  then 
			(
			not2.text  = "Bitmis islem : Toplam yükseklik (H) belirlendi"
			btn2.enabled=false
			not1.text  = "Yapilacak islem : "
			asaba_h = asaba_toplam_h.value/asaba_adedi.value
		ciz() -------------------
		if derinlik.value != 0 then yan() 	
			)
	)
	on derinlik changed val do  ---------------------------------------------------------------- yanak derinlik için
	(
		not2.text  = "Bitmis islem : Yanak derinligi belirlendi"
		delete $yanak*
		delete $yyanak*
		delete $yyyanak*
		yan()
	)
	on asaba_yuksekligi changed val do  --------------------------------------------------- asaba yüksekligi
	(
	not2.text  = "Bitmis islem : Asaba yüksekligi belirlendi"
	asaba_h= asaba_yuksekligi.value	
	asaba_toplam_h.value = asaba_yuksekligi.value*asaba_adedi.value
	sayh=sayh+1
	if say >= 1 or asaba_yuksekligi.value !=0 then delete $muk
	if derinlik.value != 0 then 
	(
		delete $yanak*
		delete $yyanak*
		delete $yyyanak*
	)
		if asaba_yuksekligi.value != 0 and asaba_adedi.value >= 1  then 
			(
			ciz()
			if derinlik.value != 0 then yan()
			)				
	)
	on x_mesafesi changed val do  -------------------------------------------------------- X mesafesi için
	(
	asa = x_mesafesi.value	
	not2.text  = "Bitmis islem : X ölçüsü belirlendi"
	
		if derinlik.value != 0 then
		(
			delete $yanak
		)
		
	delete $muk
	ciz()
	yan()
	)
	on chk1 changed state do -------------------------------------------------------- X mesafesi onayi için
	(
		if chk1.checked == true  then 
		(
			x_mesafesi.enabled=true
			x_mesafesi.value= asa
			not3.enabled=false
			not1.text  = "Yapilacak islem : X ölçüsünü belirleyebilirsiniz"
			not2.text  = "Bitmis islem : "
		)
		else
		(
			x_mesafesi.enabled=false
			x_mesafesi.value= p1p2mesafe
			not3.enabled=true
			not1.text  = "Yapilacak islem : "
			not2.text  = "Bitmis islem : X ölçüsü Plana baglandi"
			asa = p1p2mesafe/asaba_adedi.value
		)
	delete $muk
	ciz()
			if derinlik.value != 0 then
			(
			delete $yanak
			yan()
			)	
	)
	on okk pressed  do  -------------------------------------------------------- Çiz butonu (ok)
	(
		asaba_adedi.enabled=true
		asaba_yuksekligi.enabled=true
		asaba_toplam_h.enabled=true
		derinlik.enabled=true
		chk1.enabled=true
		not1.text  = "Yapilacak islem : Degerleri düzenleyebilirsiniz"
		not2.text  = "Bitmis islem : X ölçüsüne uygun yüksekligi   'Altin Oran'  olan çizim yapildi"
	ciz()
	)
)
createDialog kmukarnas