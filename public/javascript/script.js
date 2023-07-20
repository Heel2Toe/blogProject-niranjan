

function deleteConfirm(){
    $("#deletebox").addClass("box-y").removeClass("box-n")
  }
  function hide(){
    $("#deletebox").addClass("box-n").removeClass("box-y")
  }

  function minPassword(){

       if( ($(".password").html).length < 8 )
       {
        $(".messagebox").addClass("box-y").removeClass("box-n");
        $("#message").html("minimum 8 characters required for password");
        return false;
       }
       else{
        return true;
       }
  }

  $(window).on("load", function() {

    if ($("#message").html() === "") {
      $(".messagebox").addClass("box-n").removeClass("box-y");
    } else {
      $(".messagebox").addClass("box-y").removeClass("box-n");
    }
    
  });