import {Entity, model, property, hasMany, hasOne, belongsTo} from '@loopback/repository';

/* eslint-disable @typescript-eslint/naming-convention */

enum DeploymentState {
  Deployed = 'Deployed',
  Draft = 'Draft'
}

@model()
export class DeploymentVariable {

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
  })
  value: string;

}

@model()
export class Deployment extends Entity {

  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  solution_id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: [DeploymentState.Deployed, DeploymentState.Draft],
    },
  })
  state: DeploymentState;

  @property.array(DeploymentVariable)
  variables: DeploymentVariable[];

  constructor(data?: Partial<Deployment>) {
    super(data);
  }
}

export interface DeploymentRelations {
  // describe navigational properties here
}

export type DeploymentWithRelations = Deployment & DeploymentRelations;