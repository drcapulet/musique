function secondsToTime(secs)
{
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };

	str = (obj.m || "0") + ":";
	if(obj.s < 10 || obj.s == null || obj.s == "undefined") {
		str += "0";
	}
	str += (obj.s || "0");
    return str;
};

function miniScrollInit(elem) {
	elem.find("#" + elem[0].id + "-text").text("Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus");
	elem.data('scrollOriginalWidth', elem.width());
	elem.find("#" + elem[0].id + "-text").text("");
	elem.css({ width: "20000px" });
};

function miniScroll(elem) {
	if(elem.find("#" + elem[0].id + "-text").width() !== "0px") {
		if((elem.find("#" + elem[0].id + "-text").width() > parseInt(elem.data('scrollOriginalWidth'), 10))) {
			elem.animate({ left: "-" + (elem.find("#" + elem[0].id + "-text").width() - parseInt(elem.data('scrollOriginalWidth'), 10)) + "px" }, 5000, "linear").delay(3000).animate({ left: "0px" }, 5000, "linear");
		}
		setTimeout("miniScroll($('#" + elem[0].id + "'))", 16000);
	} else {
		setTimeout("miniScroll($('#" + elem[0].id + "'))", 2000);
	}
};

var Playlist = function(instance, playlist, options) {
	var self = this;

	this.instance = instance; // String: To associate specific HTML with this playlist
	this.playlist = playlist; // Array of Objects: The playlist
	this.options = options; // Object: The jPlayer constructor options for this playlist

	this.current = 0;

	this.cssId = {
		jPlayer: "",
		interface: "",
		playlist: ""
	};
	this.cssSelector = {};
 
	$.each(this.cssId, function(entity, id) {
		self.cssSelector[entity] = "#" + id + self.instance;
	});

	if(!this.options.cssSelectorAncestor) {
		this.options.cssSelectorAncestor = this.cssSelector.interface;
	}
	
	this.allowedToPlay = false;
	this.renderjPlayer = (typeof this.instance !== "undefined" && this.instance !== null && this.instance !== "");
	console.log(this.renderjPlayer);
	
	if (this.renderjPlayer && this.allowedToPlay) {
		$(this.cssSelector.jPlayer).jPlayer(this.options);
	}
	
	this.displayPlaylist();
	
	if(this.renderjPlayer) {
		$(".jp-previous").click(function() {
			// self.playlistPrev();
			now.previousSong();
			// $(this).blur();
			return false;
		});

		$(".jp-next").click(function() {
			// self.playlistNext();
			now.nextSong();
			// $(this).blur();
			return false;
		});
		
		$('#volume-slider input[type=range]').change(function(){
			console.log($(this).val());
		    now.updateVolume($(this).val()/100)
		});
		
		$("#song-play-pause").click(function () {
			if(self.renderjPlayer) {
				if($(this).hasClass('paused')) {
					now.play();
				} else {
					now.pause();
				}
			}
			return false;
		});
	
		$("#song-list .song-listing").live("click", function () {
			self.playlistChange(parseInt($(this).attr('data-index'), 10));
			self.playlistPlay();
			now.updatePlaylist(JSON.stringify({ playlist: self.playlist, current: self.current }));
			now.play();
			return false;
		});
	}

};
Playlist.prototype = {
	displayPlaylist: function() {
		var out = "";
		for(index = 0; index < this.playlist.length; index++) {
			value = this.playlist[index];
			out += '<div class="song-listing" data-index="' + index + '"><div class="song-listing-index"><span>' + (index + 1) + '</span></div><div class="song-listing-album-art"><img src="' + value.artworkURL + '" height="35" /></div><div class="song-listing-album-information"><div class="song-listing-album-information-song">' + value.songName + '</div><div class="song-listing-album-information-artist">' + value.albumName + " by " + value.artistName + '</div></div></div>';
		}
		document.getElementById("song-list").innerHTML = out;
		out = "";
		if(!this.renderjPlayer) {
			try {
			console.log('disp');
			document.getElementsByClassName("current")[0].style.background = "#000 url('" + this.playlist[this.current].artworkURL + "')";
			document.getElementsByClassName("next")[0].style.background = "#000 url('" + this.playlist[this.current+1].artworkURL + "')";
			document.getElementsByClassName("next2nd")[0].style.background = "#000 url('" + this.playlist[this.current+2].artworkURL + "')";
			document.getElementsByClassName("off-left")[0].style.background = " #000 url('" + this.playlist[this.current-1].artworkURL + "')";
			document.getElementsByClassName("off-right")[0].style.background = " #000 url('" + this.playlist[this.current+3].artworkURL + "')";
			} catch(e){e};
		}
		this.updateButtons();
		if(!this.renderjPlayer) {
			elements = document.getElementById("song-list").children;
			for(i = 0; i < elements.length; i++) {
				new MBP.fastButton(elements[i], function (e) {
					now.updatePlaylist(JSON.stringify({ playlist: audioPlaylist.playlist, current: parseInt(e.target.getAttribute('data-index'), 10), playing: true }));
				});
			}
		}
	},
	updateButtons: function() {
		if(this.renderjPlayer && $(this.cssSelector.interface).data("jPlayer")) {
			paused = $(this.cssSelector.interface).data("jPlayer").status.paused;
			if(paused) {
				$("#song-play-pause").addClass('paused');
			} else {
				$("#song-play-pause").removeClass('paused');
			}
		} else {
			
		}
		return false;
	},
	playlistInit: function(autoplay) {
		if(autoplay) {
			this.playlistChange(this.current);
		} else {
			this.playlistConfig(this.current);
		}
	},
	playlistConfig: function(index) {
		// $(this.cssSelector.playlist + "_item_" + this.current).removeClass("jp-playlist-current").parent().removeClass("jp-playlist-current");
		// $(this.cssSelector.playlist + "_item_" + index).addClass("jp-playlist-current").parent().addClass("jp-playlist-current");
		this.current = index;
		this.displayPlaylist();
		if(this.playlist.length > 0) {
			if (this.renderjPlayer) {
				$(this.cssSelector.jPlayer).jPlayer("setMedia", this.playlist[parseInt(this.current, 10)]);
				$("#song-album-art").attr('src', this.playlist[parseInt(this.current, 10)].artworkURL);
			}
			if($("#song-information-name-album").length > 0) {
				$("#song-information-name-album").stop();
				$("#song-information-name-album").css({ left: 0 });
			}
			$("#song-artist-text").text(this.playlist[parseInt(this.current, 10)].artistName);
			$("#song-album-text").text(this.playlist[parseInt(this.current, 10)].albumName);
			$("#song-name-text").text(this.playlist[parseInt(this.current, 10)].songName);
		}
	},
	playlistChange: function(index) {
		this.playlistConfig(index);
		if (this.renderjPlayer) {
			$(this.cssSelector.jPlayer).jPlayer("play");
		}
	},
	playlistNext: function() {
		var index = (this.current + 1 < this.playlist.length) ? this.current + 1 : 0;
		if(!this.renderjPlayer) {
			console.log('move');
			document.getElementsByClassName('off-left')[0].setAttribute('class','temp album-art ');
			document.getElementsByClassName('current')[0].setAttribute('class','off-left album-art under');
	  		document.getElementsByClassName('next')[0].setAttribute('class','current album-art');
	  		document.getElementsByClassName('next2nd')[0].setAttribute('class','next album-art');
	  		document.getElementsByClassName('off-right')[0].setAttribute('class','next2nd album-art');
	  		document.getElementsByClassName('temp')[0].setAttribute('class','off-right album-art ');
		}
		this.playlistChange(index);
	},
	playlistPrev: function() {
		var index = (this.current - 1 >= 0) ? this.current - 1 : this.playlist.length - 1;
		if(!this.renderjPlayer) {
			document.getElementsByClassName('off-right')[0].setAttribute('class','album-art temp')
			document.getElementsByClassName('next2nd')[0].setAttribute('class','off-right album-art under')
			document.getElementsByClassName('next')[0].setAttribute('class','next2nd album-art')
			document.getElementsByClassName('current')[0].setAttribute('class','next album-art')
			document.getElementsByClassName('off-left')[0].setAttribute('class','current album-art');
			document.getElementsByClassName('temp')[0].setAttribute('class','off-left album-art')
		}
		this.playlistChange(index);
	},
	playlistAdd: function(song) {
		this.playlist.push(song);
		now.updatePlaylist(JSON.stringify({ playlist: this.playlist, current: this.current }));
	},
	playlistUpdate: function(songs, curr, playing) {
		if(songs !== null && curr !== null) {
			same_song = songs[curr] == this.options[this.current];
			this.playlist = songs;
			if(!same_song) {
				this.current = curr;
				this.playlistConfig(this.current);
			} else {
				this.displayPlaylist();
			}
			if(playing === true) {
				audioPlaylist.playlistPlay();
			}
		}
	},
	playlistPlay: function() {
		console.log("play");
		if(this.renderjPlayer && $(this.cssSelector.interface).data("jPlayer")) {
			if($(this.cssSelector.interface).data("jPlayer")) {
				$(this.cssSelector.interface).jPlayer("play");
			}
			$("#song-play-pause").removeClass('paused');
		} else {
			document.getElementById('song-play-pause').className = "";
		}
	},
	playlistPause: function () {
		console.log("pause");
		if(this.renderjPlayer && $(this.cssSelector.interface).data("jPlayer") && !$(this.cssSelector.interface).data("jPlayer").status.paused) {
			if($(this.cssSelector.interface).data("jPlayer")) {
				$(this.cssSelector.interface).jPlayer("pause");
			}
			$("#song-play-pause").addClass('paused');
		} else {
			document.getElementById('song-play-pause').className = "paused";
		}
	},
	playlistUpdateTime: function (data) {
		song = this.playlistCurrent();
		// if(this.renderjPlayer) {
		$("#song-so-far").text(data.sofar);
		$("#song-duration").text(data.duration);
		oldwidth = $("#song-progress-played").width();
		$("#song-progress-played").css({ 'width':  data.progress });
		document.getElementById("song-progress-played").style.width = data.progress;
		newwidth = $("#song-progress-played").width();
		if(newwidth !== oldwidth) {
			$("#song-play-pause").removeClass("paused");
		}
		// }
	},
	playlistCurrent: function () {
		return this.playlist[this.current];
	},
	playlistEnable: function () {
		this.allowedToPlay = true;
		if(this.renderjPlayer) {
			$(this.cssSelector.jPlayer).jPlayer(this.options);
		}
		this.displayPlaylist();
	},
	playlistDisable: function () {
		if(this.renderjPlayer && $(this.cssSelector.interface).data('jPlayer')) {
			$(this.cssSelector.interface).jPlayer("destroy");
		}
		this.allowedToPlay = false;
	}
};

var previousWidth, newWidth;

function continueUpdatingButtons() {
	if(audioPlaylist.renderjPlayer && audioPlaylist.allowedToPlay) {
		audioPlaylist.updateButtons();
	}
	setTimeout("continueUpdatingButtons()", 200);
};