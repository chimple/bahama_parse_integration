import {FilePointer, Pointer} from "./parseSchool";

export class ParseStudent {
    objectId: string;
    name: string;
    school: Pointer;
    section: Pointer;
    gender: string;
    age: number;
    image: FilePointer;
    createdAt: string;
    updatedAt: string;
}