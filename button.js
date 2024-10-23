// $(".toggle").on("click", function() {
//     $(".toggle").toggleClass("checked");
//     if(!$('input[name="check"]').prop("checked")) {
//       $(".toggle input").prop("checked", true);
//     } else {
//       $(".toggle input").prop("checked", false);
//     }
//   });


  // // 手動で変更後にchangeイベントを発火
  // $(".toggle").on("change");

$(".toggle").on("click", function() {
  $(".toggle").toggleClass("checked");

    if(!$('input[name="check"]').prop("checked")) {
      $(".toggle input").prop("checked", true);
      return false;
    } else {
      $(".toggle input").prop("checked", false);
      return false;
    }

});
