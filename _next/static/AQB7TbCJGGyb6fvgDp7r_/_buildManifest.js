self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [
      {
        "source": "/wangjia-indonesia/:countryCode/products/:handle([^/.]+).md",
        "destination": "/wangjia-indonesia/:countryCode/products/:handle/markdown"
      },
      {
        "has": [
          {
            "type": "header",
            "key": "accept",
            "value": ".*text/markdown.*"
          }
        ],
        "source": "/wangjia-indonesia/:countryCode/products/:handle([^/.]+)",
        "destination": "/wangjia-indonesia/:countryCode/products/:handle/markdown"
      }
    ],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()