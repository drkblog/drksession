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
  matchFromUrl(url: string): boolean {
    return this.match(this.getPathFromUrl(url));
  }

  match(path: string): boolean {
    const match = path.match(this.regex);
    return match !== null;
  }
  getRouteParameterFromUrl(url: string, variable: string): string {
    return this.getRouteParameter(this.getPathFromUrl(url), variable);
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

  private getPathFromUrl(url: string): string {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname;
  }
}
