export class ParseSchool {
    objectId: string;
    user: Pointer;
    name: string;
    createdAt: string;
    updatedAt: string;
    subjects: [Pointer];
    image: FilePointer;
    __type: string;
    className: string;
}

export interface Pointer {
    __type: string;
    className: string;
    objectId: string;
}

export interface FilePointer {
    __type: string;
    name: string;
    url: string;
}