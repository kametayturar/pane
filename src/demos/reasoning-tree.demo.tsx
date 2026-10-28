import { ReasoningTree } from "@/components/illustrations/reasoning-tree"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center p-4">
      <ReasoningTree {...props} />
    </div>
  )
}

export const notes = [
  "It runs a real beam search on the data you pass: at each level the candidates are the children of the thoughts kept so far, the top `beamWidth` by score survive, and the best surviving leaf gives the answer and the path back to the question. Change the beam width and the whole search replays.",
  "Every node's look is a pure function of time: stageOf(node, t) returns hidden, proposed, scoring, kept, pruned or on-the-best-path. One rAF clock advances t; React re-renders only when some node changes stage, and the entrance, bars and edges are CSS animations that pause with the scene.",
  "Edges are SVG cubic Béziers with pathLength=1, so stroke-dashoffset 1 → 0 draws them, and a pruned edge 'retracts' by animating stroke-dasharray from 1 1 to .3 1. The best path gets a second path with a short dash that travels along it for the sheen.",
  "The score digits roll without JavaScript: an @property --n registered as an <integer> is animated from 0, and a counter prints it through content: counter(n). It is the one way CSS can animate a number.",
  "Accessibility: nodes are role=treeitem with aria-level, position and a name that includes score and state, a roving tabindex makes the tree one Tab stop, and the arrow keys walk columns and parent/child links.",
]
