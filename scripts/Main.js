// GLOBALS
var playlistManager;
var youTubeApiReady = false;
var player = null;
var SOUNDCLOUD_API_KEY = '206f38d9623048d6de0ef3a89fea1c4d';
var OFFICIALFM_API_KEY = 'gLc8fHvg39ez6EAYvxFA';
var selectedVideoElements = [];

$(document).ajaxError(function (e, r, ajaxOptions, thrownError) {
    if (r.status === 500 && $.trim(r.responseText).length > 0) {
        if (ON_PRODUCTION) {
            Notifications.append('Connection error! <i>' + r.responseText + '</i>');
        } else {
            $('body').html(r.responseText);
        }
    }
});

var initEverymote = function(player){
    console.log(everymote);

    var callbackHandler = function(data){

        if(data.event === 'next'){
            player.next();
        }else if(data.event === 'previous'){
            player.prev();
        }else if(data.event === 'pause'){
            player.pause();
        }else if(data.event === 'play'){
            if(player.isPlaying){return;}
            
            player.playPause();
        }
    };
    
    var config = {
                    container: "everymoteContainer"
                    ,url:'http://localhost:1338/predefined/simplemedia.html'
                    ,callback: callbackHandler
                    };
    everymote.mediaController.init(config);

    var receiver = function(ev) {
        

        if(ev.data.event === "titleUpdated"){
            everymote.mediaController.nowPlaying(ev.data.title);
        } else if(ev.data.event === "playPause"){
            if(ev.data.playPause === 'pause'){
                everymote.mediaController.pause();
            } else{
                 everymote.mediaController.play();
            }
        } 

   
    };

    
        if(window.addEventListener){
            window.addEventListener('message', receiver, false);
        } else{
            window.attachEvent('onmessage', receiver);
        }
    
};


$(document).ready(function() {
    EventSystem.init();
    Menu.init();

    playlistManager = new PlaylistsManager();

    LoadingBar.init();
	Volume.init();
	TranslationSystem.init();
    SpotifyImporterPopup.init();
    SettingsPopup.init();
    Search.init();
    Queue.init();
    Ping.init();
    Notifications.init();
    player = new PlayerManager();
    player.init();
    Timeline.init();
    InfoPopup.init();
    VideoInfo.init();
    FlattrFinder.init();
    BottomPanel.init();
    UserManager.init(USER);
    TopMenu.init();
    URIManager.init();
    initEverymote(player);
});



function onYouTubePlayerAPIReady() {
    youTubeApiReady = true;
	// 
	// Player cannot be loaded before
	// $(window).load()
}
