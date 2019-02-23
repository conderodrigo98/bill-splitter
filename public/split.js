$(document).ready(()=>{

	//scroll to bottom
	$(".jump").click(()=>{
		var h = $("html, body").height();
		$("html, body").animate({scrollTop: h}, 3000)
	});

});
