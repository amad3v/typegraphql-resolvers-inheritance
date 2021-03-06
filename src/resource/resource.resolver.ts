import { Service } from 'typedi';
import {
  Query,
  Arg,
  Int,
  Resolver,
  ArgsType,
  Field,
  Args,
  FieldResolver,
  Root,
  ClassType,
} from 'type-graphql';

import { Resource } from './resource';
import { ResourceService, ResourceServiceFactory } from './resource.service';

@ArgsType()
export class GetAllArgs {
  @Field(() => Int)
  skip: number = 0;

  @Field(() => Int)
  take: number = 10;
}

export function ResourceResolver<TResource extends Resource>(
  ResourceCls: ClassType<TResource>,
  resources: TResource[],
): any {
  const resourceName = ResourceCls.name.toLocaleLowerCase();

  // `isAbstract` decorator option is mandatory to prevent multiple registering in schema
  @Resolver(() => ResourceCls, { isAbstract: true })
  @Service()
  abstract class ResourceResolverClass {
    protected resourceService: ResourceService<TResource>;

    constructor(factory: ResourceServiceFactory) {
      this.resourceService = factory.create(resources);
    }

    @Query(() => ResourceCls, { name: `${resourceName}` })
    protected async getOne(@Arg('id', () => Int) id: number) {
      return this.resourceService.getOne(id);
    }

    @Query(() => [ResourceCls], { name: `${resourceName}s` })
    protected async getAll(@Args() { skip, take }: GetAllArgs) {
      const all = this.resourceService.getAll(skip, take);
      return all;
    }

    // dynamically created field with resolver for all child resource classes
    @FieldResolver({ name: 'uuid' })
    protected getUuid(@Root() resource: Resource): string {
      return `${resourceName}_${resource.id}`;
    }
  }

  return ResourceResolverClass;
}
