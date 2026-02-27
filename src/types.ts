export interface Field {
  name: string;
  type: string;
  required: boolean;
}

export interface Endpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
}

export interface Rule {
  name: string;
  description: string;
}

export interface NodeData {
  label: string;
  type: string;
  fields?: Field[];
  endpoints?: Endpoint[];
  rules?: Rule[];
  description?: string;
  config?: Record<string, any>;
}

export type NodeType = 'model' | 'controller' | 'service' | 'route' | 'database' | 'auth' | 'middleware';

export interface Project {
  id: string;
  name: string;
  graphData: {
    nodes: any[];
    edges: any[];
  };
}

export type Language = 'en' | 'pt';
