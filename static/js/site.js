window.obfuscate = function (selector) {
  var $el = $(selector);
  var p = "mailto:";
  var n = "hello";
  var d = "davidnix";
  var href = p + n + "@" + d + ".io";

  $el.on("click", function () {
    $el.attr("href", href);
    setTimeout(function () {
      $el.attr("href", "#");
    }, 25);
  });
};

obfuscate("#email");

window.Prod = window.location.hostname != "localhost"
