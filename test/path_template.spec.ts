import { describe, it, expect, beforeEach } from 'vitest';
import { PathTemplate } from '../src/path_template';

describe('PathTemplate', () => {
  let pathTemplate: PathTemplate;

  beforeEach(() => {
    pathTemplate = new PathTemplate('/user/{id}/profile');
  });

  describe('constructor', () => {
    it('should initialize template and regex correctly', () => {
      expect(pathTemplate).toBeDefined();
      expect(pathTemplate['template']).toEqual('/user/{id}/profile');
      expect(pathTemplate['regex'].source).toEqual('^\\/user\\/(?<id>[^/]+)\\/profile$');
    });
  });

  describe('match', () => {
    it('should return matched parameters when path matches the template', () => {
      const result = pathTemplate.match('/user/123/profile');
      expect(result).toEqual({ id: '123' });
    });

    it('should return null when path does not match the template', () => {
      const result = pathTemplate.match('/user/profile');
      expect(result).toBeNull();
    });
  });

  describe('getRouteParameter', () => {
    it('should return the value of the specified route parameter', () => {
      const result = pathTemplate.getRouteParameter('/user/123/profile', 'id');
      expect(result).toEqual('123');
    });

    it('should return an empty string if the route parameter is not found', () => {
      const result = pathTemplate.getRouteParameter('/user/profile', 'id');
      expect(result).toEqual('');
    });
  });
});
