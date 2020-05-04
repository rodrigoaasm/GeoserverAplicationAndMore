var ipServer = "192.168.56.101";


//Definir coordenadas de borda
var bounds = [-74.047185, 40.679648,
           -73.90782, 40.882078];

var last_polygon = null;

//Instaciando classe que controla mouse
var mousePositionControl = new ol.control.MousePosition({
 coordinateFormat: ol.coordinate.createStringXY(4),
 projection: 'EPSG:4326',
 className: 'custom-mouse-position',
 target: document.getElementById('mouse-position'),
 undefinedHTML: '&nbsp;'
});

//formatador WFS
var formatWFS = new ol.format.WFS();

//Serializador de XML para transferencia pela internet
var s = new XMLSerializer();  

//Instaciando a origem da layer onde será desenhado os novos poligonos 
var vectorDrawing = new ol.source.Vector({wrapX: false}); 

//Instaciando a origem da layer dos lotes
var vectorLotes = new ol.source.Vector({
  format : new ol.format.GML(),
  url : "http://"+ipServer+":8080/geoserver/tiger/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tiger:lote&outputFormat=GML3&srsname=EPSG:3857"
});

vectorLotesLayer = new ol.layer.Vector({
  source: vectorLotes,//definindo origem dos polygon
  style: new ol.style.Style({//Definindo cores e estilos
    fill: new ol.style.Fill({
      color: 'rgba(87, 20, 87, 0.6)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(87, 20, 87, 1.0)',
      width: 2
    })
  })
})

var map = new ol.Map({ //Iniciando o mapa
   target: 'map',
  controls:ol.control.defaults().extend([
     mousePositionControl,
     new ol.control.ScaleLine()
  ]),
            
  layers: [
      new ol.layer.Image({//Recuperando as camadas em imagens WMS
           source: new ol.source.ImageWMS({
               ratio: 1,
               url: 'http://'+ipServer+':8080/geoserver/tiger/wms',
               params: {//Definindo formato da imagem dos tiled
                       'FORMAT': 'image/png',
                       'VERSION': '1.1.1',  
                       //definindo quais layers serão exibidos
                       "LAYERS": ['tiger:poly_landmarks','tiger:tiger_roads','tiger:poi'],
                       "exceptions": 'application/vnd.ogc.se_inimage',
               }
           })
       }),
       
       //Definindo layer dos desenhos
        new ol.layer.Vector({
          source: vectorDrawing,//definindo origem dos polygon
          style: new ol.style.Style({//Definindo cores e estilos
            fill: new ol.style.Fill({
              color: 'rgba(252, 117, 208, 0.4)'
            }),
          })
        }),
        //Definindo layer dos lotes já cadastrado
        vectorLotesLayer
   ],
  //Definindo a forma de visualização
   view: new ol.View({       
       projection: new ol.proj.Projection({
           code: 'EPSG:4326',
           units: 'degrees',
           //axisOrientation: 'neu',
           global: true,              
       })          
   })
});

//Instaciando o seletor de poligonos
var selectClick = new ol.interaction.Select({
  condition: ol.events.click
});
//Adicionando interação
map.addInteraction(selectClick);
selectClick.on('select',function(evt){
  abrirModalProp(evt.target.getFeatures().item(0));
});

//instaciando o modify, a interface de desenho e o snap
var modify = new ol.interaction.Modify({source: vectorDrawing});
var draw = new ol.interaction.Draw({
            source: vectorDrawing,
            type: "Polygon"
          });
var snap = new ol.interaction.Snap({source: vectorDrawing});

//Tratando evento de finalização de desenho
draw.on('drawend',
      function(evt) {
        last_polygon = evt.feature;//salvando poligono para o upload
        createMeasureTooltip(last_polygon.getGeometry());//calculando área do poligono
      }, this);

map.getView().fit(bounds, map.getSize());//definindo bordas e temanho do mapa a ser visualizado

//Criando rótulo de área
function createMeasureTooltip(poli) {    
         measureTooltipElement = document.createElement('div');//Instacia rótulo
         //Faz o calculo
         area = formatArea(poli);
         measureTooltipElement.innerHTML = area;// (area < 10000 ? (area* 1000).toFixed(2) + "m²" : area.toFixed(2) + "km²");
         measureTooltipElement.className = 'tooltip tooltip-measure';
         measureTooltip = new ol.Overlay({//posiciona rótulo
           element: measureTooltipElement,
           offset: [0, -15],
           positioning: 'bottom-center'
         });
         measureTooltip.setPosition(poli.getInteriorPoint().getCoordinates());
         map.addOverlay(measureTooltip);//Adiciona para visão
}

var formatArea = function(polygon) {
  var area = ol.sphere.getArea(polygon);
  var output;
  if (area * 10000 > 1) {
    output = (Math.round(area * 1000000 / 100)) + ' ' + 'km<sup>2</sup>';
  } else {
    output = (Math.round(area * 1000000 * 10000) / 100) + ' ' + 'm<sup>2</sup>';
  }
  return output;
};
//Botões do sistemas
//Botão do menu exportar
$('#open-modal').click(function (){
  $("#modal-form").modal('show'); 
  $(".tooltip").hide();
});


//botão desenhar
$('#draw').click(function (){
  //Se a classe btn-primary não existir, adiciona o modo de desenho ao map
  if(!$(this).hasClass("btn-primary")){         
      $(this).addClass(" btn-primary"); //Adiciona classe
      $("#up-polygon").removeClass("hidden-element");
      map.addInteraction(modify);//Adicionando as classes de interação
      map.addInteraction(draw);
      map.addInteraction(snap); 
      map.removeInteraction(selectClick);
  }else{//Se existir a classe, remove modo de desenho do map
      $(this).removeClass(" btn-primary");
      $("#up-polygon").addClass("hidden-element");
      map.removeInteraction(draw);//removendo as classes de interação
      map.removeInteraction(modify);
      map.removeInteraction(snap); 
      map.addInteraction(selectClick);
  }
 });


//botão de salve do desenho
$("#up-polygon").click(function(){
  abrirModalProp();
});

//Função responsável por abrir o modal
var abrirModalProp = function(f = null){
  $("#input-cpf-prop").mask("999.999.999-99");
  if(last_polygon != null){  
    $("#input-nome-prop").val("");
    $("#input-cpf-prop").val("");  
    $("#form-prop-ok").css("display",'inline'); 
    $("#modal-form-prop").show();
    $(".tooltip").hide();    
  }else if(f != null){
    console.log(f);
    $("#input-nome-prop").val(f.get("propretarionome"));
    $("#input-cpf-prop").val(f.get("propretariocpf"));
    $("#form-prop-ok").css("display",'none');
    $("#modal-form-prop").show();
  }
}

//X da modal 
$("#close_modal").click(function(){
  $(".tooltip").show();
})

$("#close-modal-prop").click(function(){  
  $("#modal-form-prop").hide();
  $(".tooltip").show();
})

//Botão de confirmação da exportação
$('#form-ok').click(function(){
   var format = $('#input-format').val();
   var layers = [];
   //checando os check box de layers
   $(".input-layers").each(function(el){
       if($(this).is(':checked')){
         layers.push($(this).val());
       }
   });

   //Se a seleção é padrão
   if(format == 'default'){
     alert("Selecione o formato!");
   }else if(format == 1){//construido url para shape-file
     var url = "http://"+ipServer+":8080/geoserver/tiger/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=";              
     url = buildUrl(url,layers,',');              
     url +="&maxFeatures=50&outputFormat=SHAPE-ZIP";
     window.open(url);
   }else if(format == 2){//construido url para GML
     var url ="http://"+ipServer+":8080/geoserver/tiger/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=";
     url = buildUrl(url,layers, ",");
     url += "&maxFeatures=50&outputFormat=GML3&srsname=EPSG:3857";
     window.open(url);
   }else if(format == 3){//construido url para KML
     var url = "http://"+ipServer+":8080/geoserver/tiger/wms/kml?layers=";
     url = buildUrl(url,layers,',');
     window.open(url);
   }else if(format == 4){//construido url para png
     var url = "http://"+ipServer+":8080/geoserver/tiger/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=";
     url = buildUrl(url,layers,',');
     url += "&exceptions=application/vnd.ogc.se_inimage&SRS=EPSG:4326&STYLES=&WIDTH=726&HEIGHT=600&BBOX=-74.10209545526699,40.67773758201697,-73.85284313593105,40.88373123436072";
     window.open(url);
   }
});

//Função de construção da URL de requerimento
function buildUrl(url,layers,charDiv){
 layers.forEach(function(value, index, array){
   url += value + charDiv;
 });
 return url.substr(0,url.length -1);
}

//Botão salvar poligono
$("#form-prop-ok").click(function(){

  if($("#input-nome-prop").val() != "" && $("#input-cpf-prop").val() != ""){//validando formulário
    last_polygon.setProperties({//Definindo propriedades do poligono
                                "propretarionome": $("#input-nome-prop").val(),
                                "propretariocpf": $("#input-cpf-prop").val()
                              });

    transWFS(last_polygon);//Efetuando transação do poligono
    $("#modal-form-prop").hide();
  }else{
    alert("Preecha todos os campos!");
  }
});

//Formatador GML
var formatGML = new ol.format.GML({
  featureNS: 'tiger',
  featureType: 'lote',
  srsName: 'EPSG:3857'
});

//Função responsável por efetuar a transação 
var transWFS = function (f) {
  var wfsTrans = formatWFS.writeTransaction([f], null, null, formatGML);  

  $.ajax('http://'+ipServer+':8080/geoserver/tiger/ows', {
      type: 'POST',
      dataType: 'xml',
      processData: false,
      contentType: 'text/xml',
      data: s.serializeToString(wfsTrans)
  }).done(function() {
      vectorDrawing.clear();//Limpando layer de desenhos
      last_polygon=null;
  });
};



