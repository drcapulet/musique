$(document).ready(function() {
    $("#join").click(function() {
        console.log("clickclick");
        var room = $("#room").val();
		if(room !== "") {
			if(/mobile/i.test(navigator.userAgent)) {
				window.location = "/mobile/" + room;
			} else {
		        window.location = "/playlist/" + room;
			}
		}
    });
  $("#join-form").submit(function () { $("#join").click(); return false; });
});
