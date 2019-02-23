$(document).ready(function(){
	count = 2 //start amount of people at 2

	//add people
	$("#add").click(function(){
		count ++
		$(this).before(
			'<div class="form-group" id="'+count+'"><label for="person'+count+'">Your Friend\'s Name:</label><input type="text" class="form-control" name="person'+count+'"></div>'
		)
	});

	//remove people
	$("#del").click(function(){
		if (count >2){
			$("#"+count).remove();
			count --;
		}else{
			$(".btn-success").after(
				'<div class="alert alert-warning alert-dismissible"> <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a> A session cannot have less than 2 people. </div>'
			)
		}
	});
});