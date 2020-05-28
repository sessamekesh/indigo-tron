export class Blackboard<TypeMap> {
  private map = new Map<any, any>();

  set<KeyType extends keyof TypeMap>(key: KeyType, value: TypeMap[KeyType]) {
    this.map.set(key, value);
  }

  get<KeyType extends keyof TypeMap>(key: KeyType): TypeMap[KeyType] | undefined {
    return this.map.get(key);
  }

  delete<KeyType extends keyof TypeMap>(key: KeyType) {
    this.map.delete(key);
  }

  forceGet<KeyType extends keyof TypeMap>(key: KeyType): TypeMap[KeyType] {
    const result = this.map.get(key);
    if (result == undefined) {
      throw new Error('ForceGet called on null key');
    }
    return result;
  }

  clear() {
    this.map.clear();
  }
}
