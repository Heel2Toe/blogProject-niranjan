

function deleteConfirm(){
    $(".deletebox").addClass("box-y").removeClass("box-n")
  }
  
  function hide(){
    $(".deletebox").addClass("box-n").removeClass("box-y")
  }



  function Password(){

       if( ($(".password").val().length) < 8 || $(".password").val() != $(".prePassword").val())
       {
        $(".messagebox").addClass("box-y").removeClass("box-n");

          if($(".password").val().length < 8){
          $("#message").html("minimum 8 password characters required");
          return false;
           }

        else if($(".password").val() != $(".prePassword").val()){
        $("#message").html("confirm password mismatch");
        return false;
        }
      }

       else
        {
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