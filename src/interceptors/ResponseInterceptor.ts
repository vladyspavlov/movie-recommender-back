import { Interceptor, InterceptorInterface, Action } from 'routing-controllers'
 
@Interceptor()
export class ResponseInterceptor implements InterceptorInterface {
    intercept(action: Action, content: any) {
        console.log(action.response.getHeaders())
        //console.log(content)
        return {
            status: 'ok',
            data: content
        }
    }
}