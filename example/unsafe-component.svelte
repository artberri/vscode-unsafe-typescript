<script lang="ts">
export const asKeyword = (array: { hello: string }[]) => {
	console.log((array[0] as { hello: string }).hello);
};

export const angleBracketedTypeAssertion = (array: { hello: string }[]) => {
	console.log((<{ hello: string }>array[0]).hello);
};

export const nonNullAssertion = (array: { hello: string }[]) => {
	console.log(array[0]!.hello);
};

export function isString(x: unknown): x is string {
	return typeof x === "number";
}

export const asConst = () => {
	console.log(["hello", "world"] as const); // This is perfectly safe
};

export const asUnknown = () => {
	console.log(["hello", "world"] as unknown); // This is perfectly safe
};

let x: number = 0;
let y: number = 0;

function yPlusAValue(value: number) {
	return value + y;
}

$: total = yPlusAValue(x);
</script>

Total: {total}
<button on:click={() => x++}> Increment X </button>

<button on:click={() => y++}> Increment Y </button>
