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
  getModelSchemaRef,
  response,
  post,
  requestBody,
} from '@loopback/rest';
import {Deployment} from '../models';
import {DeploymentRepository} from '../repositories';

/* eslint-disable @typescript-eslint/no-explicit-any */

export class DeploymentController {

  constructor(
    @repository(DeploymentRepository)
    public deploymentRepository : DeploymentRepository,
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

}
