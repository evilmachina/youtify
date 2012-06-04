$(window).keyup(function (event) {
    if (event.keyCode === 27 && $('#contextmenu').length) {
        $('#context-menu-blocker, #contextmenu').remove();
    }
});

function showContextMenu(buttons, x, y) {
    var contextmenu = $('<ul id="contextmenu" />');

    $.each(buttons, function(i, item) {
        $('<li class="option" />')
            .text(item.title)
            .data('args', item.args)
            .data('callback', item.callback)
            .click(function() {
                $(this).data('callback')($(this).data('args'));
                $('#context-menu-blocker, #contextmenu').remove();
            })
            .appendTo(contextmenu);
    });

    // Set up a blocker div that closes the menu when clicked
    var blocker = $('<div id="context-menu-blocker" class="blocker"></div>').mousedown(function(event) {
        $('#context-menu-blocker, #contextmenu').remove();
        event.stopPropagation();
    });

    blocker.appendTo('body');
    contextmenu.appendTo('body');

	// Make sure contextmenu does not reach outside the window
	if ((y + contextmenu.height()) > $(window).height()) {
		y -= contextmenu.height();
	}
    if ((x + contextmenu.width()) > $(window).width()) {
        x -= contextmenu.width();
    }
    contextmenu.css({
        'top': y,
        'left': x
    });

    // Finally, prevent contextmenu on our contextmenu :)
    $('#context-menu-blocker, #contextmenu, #contextmenu li.option').bind('contextmenu', function (event) {
        event.preventDefault();
    });
}

function showPlaylistContextMenu(event) {
    $('#left .selected').removeClass('selected');
    $(this).addClass('selected');
    event.preventDefault();

    var buttons = [
		{
            title: TranslationSystem.get('Import from Spotify'),
            args: $(this),
            callback: function(li) {
                li.arrowPopup('#spotify-importer', 'left');
            }
        },
        {
            title: TranslationSystem.get('Remove duplicate videos'),
            args: $(this),
            callback: function(li) {
                var index = li.index(),
                    playlist = playlistManager.getPlaylist(index);
				if (confirm(TranslationSystem.get('This will delete duplicate videos from your playlist. Continue?'))) {
                    Notifications.append(playlist.removeDuplicates() + TranslationSystem.get(' duplicates removed.'));
				}
            }
        },
        {
            title: TranslationSystem.get('Rename'),
            args: $(this),
            callback: function(li) {
                var playlist = null,
                    input = $('<input type="text"/>')
                    .addClass('rename')
                    .val(li.text())
                    .data('li', li)
                    .blur(function(event) {
                        li.find('.title').show();
                        input.remove();
                    })
                    .keyup(function(event) {
                        var playlist;
                        switch (event.keyCode) {
                            case 13: // RETURN
                                playlist = li.data('model');
                                playlist.rename(input.val());
                                playlistManager.save();
                                $(this).blur();
                                break;
                            case 27: // ESC
                                $(this).blur();
                                break;
                        }
                        event.stopPropagation();
                    });

                li.find('.title').hide();
                li.append(input);
                input.focus().select();
            }
        },
        {
            title: TranslationSystem.get('Delete/Unsubscribe'),
            args: $(this),
            callback: function(li) {
                var index = li.index(),
                    playlist = playlistManager.getPlaylist(index);

                if (confirm("Are you sure you want to delete this playlist (" + playlist.title + ")?")) {
                    playlistManager.deletePlaylist(index);
                    playlistManager.save();
                }
            }
        }
    ];

    if (logged_in && $(this).data('model').remoteId) {
        buttons.push({
            title: TranslationSystem.get('Share'),
            args: $(this),
            callback: function(li) {
                PlaylistView.showPlaylistSharePopup(li.data('model'), li, 'left');
            }
        });
    }

    if (logged_in && !$(this).data('model').remoteId) {
        buttons.push({
            title: TranslationSystem.get('Sync'),
            args: $(this),
            callback: function(li) {
                li.data('model').sync(function() {
                    playlistManager.save();
                    li.addClass('remote');
                });
            }
        });
    }

    if (logged_in && $(this).data('model').remoteId) {
        buttons.push({
            title: TranslationSystem.get('Unsync'),
            args: $(this),
            callback: function(li) {
                li.data('model').unsync();
                playlistManager.save();
                li.removeClass('remote');
            }
        });
    }

    if (ON_DEV) {
        buttons.push({
            title: 'View JSON',
            args: $(this),
            callback: function(li) {
                var playlist = li.data('model');
                alert(JSON.stringify(playlist.toJSON()));
                console.log(playlist.toJSON());
            }
        });
    }

    showContextMenu(buttons, event.pageX, event.pageY);
}

function showResultsItemContextMenu(event) {
    var li = $(this);
    var allSelectedVideos = $(this).parent().find('.video.selected');
    var video = $(this).data('model');

    if (!$(li).hasClass('selected')) {
        li.parent().find('.selected').removeClass('selected');
        li.addClass('selected');
    }

    var buttons = [
        {
            title: TranslationSystem.get('Play'),
            args: $(this),
            callback: function(elem) {
                elem.data('model').play();
            }
        },
		{
            title: TranslationSystem.get('Queue'),
            args: allSelectedVideos,
            callback: function(allSelectedVideos) {
                $.each(allSelectedVideos, function(index, li) {
                    var model = $(li).data('model');
                    if (model) {
                        Queue.addManual(model);
                    }
                });
            }
        },
		{
			title: TranslationSystem.get('Share'),
			args: $(this),
			callback: function(elem) {
                var video = $(elem).data('model');
                showVideoSharePopup(video, elem, 'up');
			}
		}
    ];

    switch (video.type) {
        case 'youtube':
        buttons.push({
            title: TranslationSystem.get('View on YouTube'),
            args: $(this),
            callback: function(elem) {
                window.open('http://www.youtube.com/watch?v=' + video.videoId);
            }
        });
        break;

        case 'soundcloud':
        buttons.push({
            title: TranslationSystem.get('View on SoundCloud'),
            args: $(this),
            callback: function(elem) {
                var url = "http://api.soundcloud.com/tracks/" + video.videoId + ".json";
                var params = {
                    client_id: SOUNDCLOUD_API_KEY
                };
                $.getJSON(url, params, function(data) {
                    window.open(data.permalink_url);
                });
            }
        });
        break;

        case 'officialfm':
        buttons.push({
            title: TranslationSystem.get('View on Official.fm'),
            args: $(this),
            callback: function(elem) {
                window.open('http://www.official.fm/tracks/' + video.videoId);
            }
        });
        break;
    }

    if (ON_DEV) {
        buttons.push({
            title: 'View JSON',
            args: $(this),
            callback: function(li) {
                alert(JSON.stringify(video.toJSON()));
                console.log(video.toJSON());
            }
        });
    }

    if ($(this).data('additionalMenuButtons')) {
        buttons = $.merge(buttons, $(this).data('additionalMenuButtons'));
    }

    showContextMenu(buttons, (event.pageX || $(this).offset().left + $(this).width()) , (event.pageY || $(this).offset().top));

    return false;
}
