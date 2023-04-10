import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    repository,
    Where,
  } from '@loopback/repository';
  import {
    param,
    get,
    patch,
    getModelSchemaRef,
    response,
    post,
    requestBody,
    RestBindings,
    oas,
    Response
  } from '@loopback/rest';
  import {inject} from "@loopback/core";
  import * as _ from 'lodash';
  import {Deployment} from '../models';
  import { DeploymentRepository, SolutionRepository, ArchitecturesRepository } from '../repositories';
  import { IascableService } from '../services/iascable.service';
  import { AnsibleAutomationService } from '../services/ansible-automation.service';
  import { BillOfMaterialVariable } from 'supercloud-lib';
  import { Inject } from 'typescript-ioc';
  
  /* eslint-disable @typescript-eslint/no-explicit-any */
  
  export class DeploymentController {

    @Inject iascableService!: IascableService;
    @Inject ansibleAutomationService!: AnsibleAutomationService;
  
    constructor(
      @repository(DeploymentRepository)
      public deploymentRepository : DeploymentRepository,
      @repository(SolutionRepository)
      public solutionRepository : SolutionRepository,
      @repository(ArchitecturesRepository)
      public architecturesRepository : ArchitecturesRepository,
    ) {}
  
    @get('/deployment/count')
    @response(200, {
      description: 'Deployment model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Deployment) where?: Where<Deployment>,
    ): Promise<Count> {
      return this.deploymentRepository.count(where);
    }
  
    @get('/deployment')
    @response(200, {
      description: 'Array of Deployment model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Deployment, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Deployment) filter?: Filter<Deployment>,
    ): Promise<Deployment[]> {
      return this.deploymentRepository.find(filter);
    }
  
    @post('/deployment')
    @response(200, {
      description: 'Deployment model instance',
      content: {'application/json': {schema: getModelSchemaRef(Deployment)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Deployment, {
              title: 'NewDeployment',
              exclude: ['id']
            }),
          },
        },
      })
      deployment: Deployment,
    ): Promise<Deployment> {
      return this.deploymentRepository.create(deployment);
    }
  
    @get('/deployment/{id}')
    @response(200, {
      description: 'Deployment model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Deployment, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.string('id') id: string,
      @param.filter(Deployment, {exclude: 'where'}) filter?: FilterExcludingWhere<Deployment>
    ): Promise<Deployment> {
      return this.deploymentRepository.findById(id, filter);
    }

    @patch('/deployment/{id}')
    @response(200, {
      description: 'Deployment model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Deployment, {includeRelations: true}),
        },
      },
    })
    async updateById(
      @param.path.string('id') id: string,
      @param.header.string('Authorization') authHeader: string,
      @inject(RestBindings.Http.RESPONSE) res: Response,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Deployment, { partial: true }),
          },
        },
      }) deploymentReq: Deployment,
    ) {
        try {
            const deployment = await this.deploymentRepository.findById(id);
            if (deploymentReq?.state && deployment.state !== 'Deployed' && deploymentReq.state === 'Deployed') {
                const result = await this.ansibleAutomationService.deploy(id, authHeader)
                if (!result) {
                    return res.status(500).send(`Unable to deploy deployment ${id}`);
                }
            }
            await this.deploymentRepository.updateById(id, deploymentReq);
            return await this.deploymentRepository.findById(id);
        } catch (e:any) {
            console.log(e);
            return res.status(409).send(e?.message);
        }
    }

    @get('/deployment/{id}/bundle.zip')
    @oas.response.file()
    async downloadBundleZip(
        @param.path.string('id') id: string,
        @inject(RestBindings.Http.RESPONSE) res: Response,
        @param.filter(Deployment, {exclude: 'where'}) filter?: FilterExcludingWhere<Deployment>
    ) {

    // Check if we have a deployment ID
    if (_.isUndefined(id)) {
        return res.sendStatus(404);
      }

    // Read the Deployment Data
    const deployment = await this.deploymentRepository.findById(id, filter);
    const variables: BillOfMaterialVariable[] = deployment.variables
    const solution = await this.solutionRepository.findById(deployment.solution_id, { include: ['architectures'] });

    if (_.isEmpty(solution)) {
        return res.sendStatus(404);
    }

    try {

    return await this.iascableService.buildSolution(solution, variables);

    } catch (e:any) {
      console.log(e);
      return res.status(409).send(e?.message);
    }
  }
}