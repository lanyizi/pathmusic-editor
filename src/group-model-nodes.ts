import type { Immutable } from '@/immutable';
import type { Model, PathMusicNode } from '@/model';

export function groupModelNodes(model: Model) {
  function getPreviousNodes(node: Immutable<PathMusicNode>) {
    return model
      .getSourceNodesByBranches(node.id)
      .value.filter((n) => n.id !== node.id);
  }
  function getNextNodes(node: Immutable<PathMusicNode>) {
    return node.branches
      .filter((branch) => branch.dstnode !== node.id)
      .map(({ dstnode }) => model.data.nodes[dstnode])
      .filter((n) => !!n);
  }

  const groups: Immutable<PathMusicNode>[][] = model.data.nodes.map(() => []);
  const processed = model.data.nodes.map(() => false);
  for (const node of model.data.nodes) {
    if (processed[node.id]) {
      continue;
    }
    const group = [node];
    processed[node.id] = true;
    // get all ancestors
    const ancestorsQueue = [...getPreviousNodes(node)];
    while (ancestorsQueue.length === 1) {
      const previous = ancestorsQueue.shift()!;
      if (processed[previous.id]) {
        break;
      }
      if (getNextNodes(previous).length > 1) {
        break;
      }
      group.push(previous);
      processed[previous.id] = true;
      ancestorsQueue.push(...getPreviousNodes(previous));
    }
    group.reverse();
    // get all descendants
    const descendantsQueue = [...getNextNodes(node)];
    while (descendantsQueue.length === 1) {
      const next = descendantsQueue.shift()!;
      if (processed[next.id]) {
        // console.log('circular reference detected', node.id, next.id);
        break;
      }
      if (getPreviousNodes(next).length > 1) {
        // console.log('branching detected', node.id, next.id);
        break;
      }
      group.push(next);
      processed[next.id] = true;
      descendantsQueue.push(...getNextNodes(next));
    }
    groups[group[0].id] = group;
  }
  return groups.filter((group) => group.length > 0);
}
