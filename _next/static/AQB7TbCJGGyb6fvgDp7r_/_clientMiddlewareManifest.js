self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/wangjia-indonesia(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!api|ucp|buy|_next\\/static|_next\\/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/((?!api|ucp|buy|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()