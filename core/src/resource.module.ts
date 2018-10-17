/*tslint:disable:no-non-null-assertion*/

import 'reflect-metadata';
import { NgModule, ModuleWithProviders, Injector, Provider } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { Resource } from './resource.core';
import { Field, ToMany, ToOne, Model } from './resource.decorators';
import { ToManyRelation } from './relations/to-many';
import { ToOneRelation } from './relations/to-one';
import {
	InjectorContainer,
	ResourceModuleConfiguration,
	ResourceModuleConfigurationWithProviders,
	HttpClientOptions,
	toDash,
	HttpVerb,
	METAKEYS,
	ResourceType
} from './utils';
import { Abstract as AbstractAdapters } from './request-handlers/abstract-adapters';
import { Abstract as AbstractBuilders } from './request-handlers/abstract-builders';
import { ToManyAdapter, ToOneAdapter, SimpleAdapter } from './request-handlers/default-adapters';
import { ToManyBuilder, ToOneBuilder, SimpleBuilder } from './request-handlers/default-builders';
import { RelationConfiguration } from './relations/relation-configuration';

/** @internal */
@NgModule({ imports: [HttpClientModule] })
export class ResourceRootModule {
	public static processRelationships() {
		const resources = Reflect.getMetadata(METAKEYS.RESOURCES, Resource);
		if (!resources) {
			return;
		} else {
			for (const [singularName, ctor] of resources.entries()) {
				const relations = Reflect.getMetadata(METAKEYS.RELATIONS, ctor);
				Reflect.ownKeys(relations).forEach(r => {
					const config = relations[r];
					this.setRelatedConstructors(config, resources);
					this.setCircularRelations(config, resources);
				});
			}
		}
	}

	private static setRelatedConstructors(config: RelationConfiguration<any, any>, resources: Map<string, ResourceType<any>>) {
		if (config.relatedResourceString) {
			config.RelatedResource = resources.get(config.relatedResourceString)!;
		}
	}
	private static setCircularRelations(config: RelationConfiguration<any, any>, resources: Map<string, ResourceType<any>>) {
		const hostResource = config.HostResource;
		const relationsOfRelated = Reflect.getMetadata(METAKEYS.RELATIONS, config.RelatedResource);
		const potentialCircularMatches: RelationConfiguration<any, any>[] = [];
		Reflect.ownKeys(relationsOfRelated).forEach(rot => {
			const relatedRelationConfig = relationsOfRelated[rot];
			if (relatedRelationConfig.RelatedResource === hostResource) {
				potentialCircularMatches.push(relatedRelationConfig);
			}
		});
		if (potentialCircularMatches.length === 1) {
			config.circular = potentialCircularMatches[0];
		} else if (potentialCircularMatches.length > 1) {
			throw Error(
				'It seems that there is a model X for which a model Y has multiple foreign keys directed to it. This is not yet implemented'
			);
			// if (!config.relatedNavigationProperty) {
			// 	throw Error(`There is a problem with a circular relation. If model X has multiple foreign keys to model Y, then you need to supply
			// 	 a navigation property to tell the ORM which of the foreign keys belongs to which relation.`);
			// }
		}
	}
	constructor(injector: Injector) {
		InjectorContainer.instance = injector;
	}
}

@NgModule({ imports: [HttpClientModule] })
class ResourceModule {
	static forRoot(options: ResourceModuleConfigurationWithProviders = {}): ModuleWithProviders {
		const config: Provider[] = [{ provide: ResourceModuleConfiguration, useValue: { rootPath: options.rootPath } }];
		return {
			ngModule: ResourceRootModule,
			providers: config.concat(options.requestHandler || [])
		};
	}
}

export {
	ResourceModule,
	Resource,
	Field,
	ToOne,
	ToMany,
	Model,
	ToManyRelation,
	ToOneRelation,
	AbstractAdapters,
	AbstractBuilders,
	ResourceModuleConfigurationWithProviders,
	ToManyAdapter,
	ToOneAdapter,
	SimpleAdapter,
	ToManyBuilder,
	ToOneBuilder,
	SimpleBuilder,
	ResourceModuleConfiguration,
	HttpClientOptions,
	toDash,
	HttpVerb,
	METAKEYS,
	ResourceType
};
