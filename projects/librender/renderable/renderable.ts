/**
 * A Renderable object contains all object
 */
export class Renderable<PerObjectData, GLResourcesType> {
  private tags = new Set<any>();

  constructor(
    public readonly perObjectData: PerObjectData, public readonly glResources: GLResourcesType) {}

  addTag(tag: any) {
    this.tags.add(tag);
  }

  hasTags(tags: any[]) {
    return tags.every(tag => this.tags.has(tag));
  }

  removeTag(tag: any) {
    this.tags.delete(tag);
  }
}
