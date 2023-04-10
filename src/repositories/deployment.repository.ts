import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasOneRepositoryFactory, repository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {Deployment, DeploymentRelations, Solution} from '../models';

export class DeploymentRepository extends DefaultCrudRepository<
  Deployment,
  typeof Deployment.prototype.id,
  DeploymentRelations
> {
  public readonly solution: HasOneRepositoryFactory<Solution, typeof Solution.prototype.id>;
  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
  ) {
    super(Deployment, dataSource);
  }
}