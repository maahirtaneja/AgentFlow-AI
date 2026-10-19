import proxy from "express-http-proxy"

export const proxyWithHeader = (serviceUrl, pathResolver) => {
    return proxy(serviceUrl, {
        ...(pathResolver ? { proxyReqPathResolver: pathResolver } : {}),
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq.user) {
                proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
            }
            return proxyReqOpts
        }
    })
}
