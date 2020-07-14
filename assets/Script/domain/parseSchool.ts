export class ParseSchool {
    code: string;
    createdAt: string;
    name: string;
    objectId: string;
    updatedAt: string;
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