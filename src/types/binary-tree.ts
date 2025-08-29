export class BinaryTreeNode {
    id: string;
    value: number;
    parent: BinaryTreeNode | null;
    left: BinaryTreeNode | null;
    right: BinaryTreeNode | null;
    tag?: string | number;

    constructor(id: string, value: number) {
        this.id = id;
        this.value = value;
        this.left = this.right = this.parent = null;
    }
}
