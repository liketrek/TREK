// Safari runs this in the page before the share sheet opens (Info.plist,
// NSExtensionJavaScriptPreprocessingFile). It hands over the page as the user
// sees it, so a booking confirmation behind a sign-in reaches TREK whole.
var SharePage = function () {};

SharePage.prototype = {
  run: function (args) {
    args.completionFunction({
      html: document.documentElement.outerHTML,
      title: document.title,
      url: document.URL,
    });
  },
  finalize: function () {},
};

var ExtensionPreprocessingJS = new SharePage();
