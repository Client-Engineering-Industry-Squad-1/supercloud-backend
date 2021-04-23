import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import _ from 'lodash';
import { ServicesController, AutomationCatalogController } from '.';
import { Bom, Services } from '../models';
import { ArchitecturesRepository, BomRepository, ServicesRepository, ControlMappingRepository } from '../repositories';

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface BomComposite {
  _id?: string,
  arch_id?: string,
  service_id: string,
  desc: string,
  automation_variables: string,
  service: Services,
  automation: object | undefined,
  catalog: {
    overview_ui: {
      en: {
        display_name: string,
        long_description: string,
        description: string,
      }
    },
    tags: string[],
    provider: {
      name: string
    },
    geo_tags: string[],
    metadata: {
      ui: {
        urls: {
          catalog_details_url: string,
          apidocs_url: string,
          doc_url: string,
          instructions_url: string,
          terms_url: string
        }
      }
    }
  }
}

export class BomController {
  constructor(
    @repository(BomRepository)
    public bomRepository : BomRepository,
    @repository(ServicesRepository)
    public servicesRepository : ServicesRepository,
    @repository(ArchitecturesRepository) 
    protected architecturesRepository: ArchitecturesRepository,
    @repository(ControlMappingRepository) 
    protected controlMappingRepository: ControlMappingRepository,
  ) {}

  @post('/boms')
  @response(200, {
    description: 'Bom model instance',
    content: {'application/json': {schema: getModelSchemaRef(Bom)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Bom, {
            title: 'NewBom',
            exclude: ['_id'],
          }),
        },
      },
    })
    bom: Omit<Bom, '_id'>,
  ): Promise<Bom> {
    await this.servicesRepository.findById(bom['service_id']);
    return this.bomRepository.create(bom);
  }

  @get('/boms/count')
  @response(200, {
    description: 'Bom model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Bom) where?: Where<Bom>,
  ): Promise<Count> {
    return this.bomRepository.count(where);
  }

  @get('/boms')
  @response(200, {
    description: 'Array of Bom model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Bom, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Bom) filter?: Filter<Bom>,
  ): Promise<Bom[]> {
    return this.bomRepository.find(filter);
  }

  @patch('/boms')
  @response(200, {
    description: 'Bom PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Bom, {partial: true}),
        },
      },
    })
    bom: Bom,
    @param.where(Bom) where?: Where<Bom>,
  ): Promise<Count> {
    return this.bomRepository.updateAll(bom, where);
  }

  @get('/boms/{id}')
  @response(200, {
    description: 'Bom model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Bom, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Bom, {exclude: 'where'}) filter?: FilterExcludingWhere<Bom>
  ): Promise<Bom> {
    return this.bomRepository.findById(id, filter);
  }

  @get('/boms/{id}/composite')
  @response(200, {
    description: 'composit API with service + catalog',
    content: {
      'application/json': {        
      },
    },
  })
  async findCompositeById(
    @param.path.string('id') id: string,
    @param.filter(Bom, {exclude: 'where'}) filter?: FilterExcludingWhere<Bom>
  ): Promise<any> {
    // eslint-disable-next-line prefer-const
    let bom =  await this.bomRepository.findById(id, filter);
    // eslint-disable-next-line prefer-const
    let jsonObj:any = JSON.parse(JSON.stringify(bom));
    // Get service data
    try {
      jsonObj.service = await (new ServicesController(this.servicesRepository,this.bomRepository,this.architecturesRepository, this.controlMappingRepository)).findById(bom.service_id, {"include":["controls"]});
      jsonObj.automation = await (new AutomationCatalogController(this.architecturesRepository,this.servicesRepository)).automationById(jsonObj.service.cloud_automation_id);
    }
    catch(e) {
      console.error(e);
    }
    // Get catalog data
    try {
      jsonObj.catalog = await (new ServicesController(this.servicesRepository,this.bomRepository,this.architecturesRepository, this.controlMappingRepository)).catalogByServiceId(bom.service_id);
    }
    catch(e) {
      console.error(e);
    }
    return jsonObj;
  }

  @patch('/boms/{id}')
  @response(200, {
    description: 'Controls model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Bom),
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Bom, {partial: true}),
        },
      },
    })
    bom: Bom,
  ): Promise<Bom> {
    await this.bomRepository.updateById(id, bom);
    return this.bomRepository.findById(id);
  }

  @del('/boms/{id}')
  @response(204, {
    description: 'Bom DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.bomRepository.deleteById(id);
  }

  @get('/boms/catalog/{bomId}')
  @response(200, {
    description: 'Bom model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Bom, {includeRelations: true}),
      },
    },
  })
  async compositeCatalogById(
    @param.path.string('bomId') bomId: string,
    @param.filter(Bom, {exclude: 'where'}) filter?: FilterExcludingWhere<Bom>
  ): Promise<any> {
    const bom_res = await this.bomRepository.findById(bomId, filter);
    const bom_serv_id = bom_res.service_id;        
    const bom_data = JSON.parse(JSON.stringify(bom_res));    
    console.log("*******bom_serv_id*********"+bom_serv_id);
    const serv_res = await (new ServicesController(this.servicesRepository,this.bomRepository,this.architecturesRepository, this.controlMappingRepository)).catalogByServiceId(bom_serv_id);    
    const srvc_data = JSON.parse(JSON.stringify(serv_res));    
  
    const result = _.merge(bom_data, srvc_data[0]);
    return result;
  }

  @get('/boms/services/{archid}')
  @response(200, {
    description: 'composit APi with bom + services + catalog',
    content: {
      'application/json': {        
      },
    },
  })
  async compositeCatalogByArchId(
    @param.path.string('archid') archid: string,    
  ): Promise<BomComposite[]> {    
    const arch_bom_res = await this.architecturesRepository.boms(archid).find({ include: ['service'] });
    const arch_bom_data = JSON.parse(JSON.stringify(arch_bom_res));
    const jsonObj = [];
    for await (const p of arch_bom_data) {
      console.log("*******p.service_id*********"+p.service_id);
      // Get service data
      try {
        p.automation = await (new AutomationCatalogController(this.architecturesRepository,this.servicesRepository)).automationById(p.service.cloud_automation_id);
      }
      catch(e) {
        console.error(e);
      }
      // Get catalog data
      try {
        p.catalog = await (new ServicesController(this.servicesRepository,this.bomRepository,this.architecturesRepository, this.controlMappingRepository)).catalogByServiceId(p.service_id);
        jsonObj.push(p);
      }
      catch(e) {
        console.error(e);
        jsonObj.push(p);
      }
    }
    return jsonObj;
  }  
}
