export class PathTemplate {
  private readonly template: string;
  private readonly regex: RegExp;

  constructor(template: string) {
    this.template = template;
    const regexStr = template.replace(/{([^}]+)}/g, (match, varName) => {
      return `(?<${varName}>[^/]+)`;
    });
    this.regex = new RegExp(`^${regexStr}$`);
  }

  match(path: string): boolean {
    const match = path.match(this.regex);
    return match !== null;
  }

  getRouteParameter(path: string, variable: string): string {
    const match = path.match(this.regex);
    if (match === null) {
      return '';
    }
    const groups = match.groups;
    if (groups === undefined) {
      throw new Error('regex match groups is undefined');
    }
    return groups[variable];
  }
}
