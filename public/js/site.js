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


window.Prod = window.location.hostname != "localhost";


$("#mc-embedded-subscribe-form").submit(function(e) {
    var form = this;

    // Stop form from submitting too early
    e.preventDefault();

    var email = $("#mce-EMAIL").val();

    analytics.track("Subscribed to Newsletter", function() {
        analytics.identify(email, {
            email: email,
        }, function() {
            $(e.target).unbind('submit');
            form.submit();
        });
    });
});
