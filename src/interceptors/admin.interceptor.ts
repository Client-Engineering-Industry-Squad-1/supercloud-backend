import {
    asGlobalInterceptor,
    injectable,
    Interceptor,
    InvocationContext,
    InvocationResult,
    Provider,
    ValueOrPromise,
  } from '@loopback/core';
  import { RestBindings } from '@loopback/rest';
  
  // List of protected resources
  const protectedTargets = [
    'ArchitecturesBomController.prototype.syncRefArchs',
    'OnBoardingStageController.prototype.create',
    'OnBoardingStageController.prototype.updateAll',
    'OnBoardingStageController.prototype.updateById',
    'OnBoardingStageController.prototype.replaceById',
    'OnBoardingStageController.prototype.deleteById',
    'ControlsController.prototype.importControls'
  ]
  
  /**
   * Interceptor checking that user has ownership over resources he's trying to
   * access.
   */
  @injectable(asGlobalInterceptor('admin'))
  export class AdminInterceptor implements Provider<Interceptor> {
  
    value() {
      return async (
        ctx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>,
      ) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const request:any = await ctx.get(RestBindings.Http.REQUEST);
        const response = await ctx.get(RestBindings.Http.RESPONSE);
    
        if (!['dev', 'test'].includes(process.env.NODE_ENV || '') && protectedTargets.includes(ctx.targetName) && !request?.scopes?.includes("super_edit")) {
            return response.status(401).send({error: {
              message: `Must have administrator privilege to perform this request.`
            }});
        }
  
        const result = await next();
        return result;
      };
    }
  }
  