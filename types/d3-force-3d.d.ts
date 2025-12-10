declare module 'd3-force-3d' {
  export interface SimulationNode {
    index?: number
    x?: number
    y?: number
    z?: number
    vx?: number
    vy?: number
    vz?: number
    fx?: number | null
    fy?: number | null
    fz?: number | null
  }

  export interface SimulationLink<NodeDatum extends SimulationNode> {
    source: NodeDatum | string | number
    target: NodeDatum | string | number
    index?: number
  }

  export interface Force<NodeDatum extends SimulationNode, LinkDatum extends SimulationLink<NodeDatum>> {
    (alpha: number): void
    initialize?(nodes: NodeDatum[], random: () => number): void
  }

  export interface Simulation<NodeDatum extends SimulationNode, LinkDatum extends SimulationLink<NodeDatum>> {
    restart(): this
    stop(): this
    tick(iterations?: number): this
    nodes(): NodeDatum[]
    nodes(nodes: NodeDatum[]): this
    alpha(): number
    alpha(alpha: number): this
    alphaMin(): number
    alphaMin(min: number): this
    alphaDecay(): number
    alphaDecay(decay: number): this
    alphaTarget(): number
    alphaTarget(target: number): this
    velocityDecay(): number
    velocityDecay(decay: number): this
    force(name: string): Force<NodeDatum, LinkDatum> | undefined
    force(name: string, force: Force<NodeDatum, LinkDatum> | null): this
    find(x: number, y: number, z?: number, radius?: number): NodeDatum | undefined
    randomSource(): () => number
    randomSource(source: () => number): this
    on(typenames: string): ((this: Simulation<NodeDatum, LinkDatum>) => void) | undefined
    on(typenames: string, listener: ((this: Simulation<NodeDatum, LinkDatum>) => void) | null): this
  }

  export function forceSimulation<NodeDatum extends SimulationNode>(
    nodes?: NodeDatum[],
    numDimensions?: number
  ): Simulation<NodeDatum, SimulationLink<NodeDatum>>

  export function forceCenter<NodeDatum extends SimulationNode>(
    x?: number,
    y?: number,
    z?: number
  ): Force<NodeDatum, SimulationLink<NodeDatum>> & {
    x(): number
    x(x: number): this
    y(): number
    y(y: number): this
    z(): number
    z(z: number): this
    strength(): number
    strength(strength: number): this
  }

  export function forceManyBody<NodeDatum extends SimulationNode>(): Force<NodeDatum, SimulationLink<NodeDatum>> & {
    strength(): number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
    strength(strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
    theta(): number
    theta(theta: number): this
    distanceMin(): number
    distanceMin(distance: number): this
    distanceMax(): number
    distanceMax(distance: number): this
  }

  export function forceCollide<NodeDatum extends SimulationNode>(): Force<NodeDatum, SimulationLink<NodeDatum>> & {
    radius(): number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
    radius(radius: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)): this
    strength(): number
    strength(strength: number): this
    iterations(): number
    iterations(iterations: number): this
  }

  export function forceLink<NodeDatum extends SimulationNode, LinkDatum extends SimulationLink<NodeDatum>>(
    links?: LinkDatum[]
  ): Force<NodeDatum, LinkDatum> & {
    links(): LinkDatum[]
    links(links: LinkDatum[]): this
    id(): (d: NodeDatum, i: number, data: NodeDatum[]) => string | number
    id(id: (d: NodeDatum, i: number, data: NodeDatum[]) => string | number): this
    distance(): number | ((d: LinkDatum, i: number, data: LinkDatum[]) => number)
    distance(distance: number | ((d: LinkDatum, i: number, data: LinkDatum[]) => number)): this
    strength(): number | ((d: LinkDatum, i: number, data: LinkDatum[]) => number)
    strength(strength: number | ((d: LinkDatum, i: number, data: LinkDatum[]) => number)): this
    iterations(): number
    iterations(iterations: number): this
  }
}
