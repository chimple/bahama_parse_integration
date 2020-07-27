import {ParseNetwork, RequestOptions, RequestParams} from './ParseNetwork';
import {
    CONNECTION_URL, CURRENT_CONNECTION,
    CURRENT_SELECTED_SCHOOL,
    LOGGED_IN_USER,
    LOGIN_URL,
    SECTION_URL,
    SECTIONS, STUDENT_URL, STUDENTS
} from '../constants';
import {ParseLoggedInUser} from '../domain/parseLoggedInUser';
import {ParseSchool} from '../domain/parseSchool';
import {ParseSection} from "../domain/parseSection";
import {ParseStudent} from "../domain/parseStudent";
import {ParseConnection} from "../domain/parseConnection";

export class ParseApi {
    public static async login(username: string, password: string): Promise<ParseLoggedInUser> {
        let jsonResult = null;
        const requestParams: RequestParams = {
            url: LOGIN_URL,
            queryParams: {username, password}
        };
        jsonResult = await ParseNetwork.get(requestParams, LOGGED_IN_USER);
        return ParseApi.fromJson(jsonResult, ParseSection);
    }

    public static getLoggedInUser(): ParseLoggedInUser {
        return ParseApi.fromJson(ParseNetwork.getFromCache(LOGGED_IN_USER), ParseLoggedInUser);
    }

    public static async connections(): Promise<ParseConnection[]> {
        let jsonResult = null;
        const loggedInUser: ParseLoggedInUser = ParseApi.getLoggedInUser();
        const condition = {
            'user': ParseNetwork.createPointer('_User', loggedInUser.objectId)
        };

        const requestParams: RequestParams = {
            url: CONNECTION_URL,
            queryParams: condition,
            isWhereQuery: true,
            includeParam: 'school,school.user'
        };
        jsonResult = await ParseNetwork.get(requestParams, CURRENT_CONNECTION);
        const cons: ParseConnection[] = ParseApi.fromJson(jsonResult, ParseConnection);
        await ParseApi.asyncForEach(cons, async (conn) => {
            await ParseApi.loadImage(conn.school.image.url, conn.school.name);
            const cachedBase64 = ParseApi.loadCachedImage(conn.school.name);
            cc.log('cached base64 for school:', conn.school.name, cachedBase64)
        })
        return cons;
    }

    public static selectedConnections(): ParseConnection[] {
        return ParseApi.fromJson(ParseNetwork.getFromCache(CURRENT_CONNECTION), ParseConnection);
    }

    public static loadCachedImage(imageCacheKey: string): any {
        return ParseNetwork.getFromCache(imageCacheKey);
    }


    public static async loadImage(imageUrl: string, cacheKey: string): Promise<any> {
        const requestParams: RequestParams = {
            url: imageUrl,
            isWhereQuery: false
        };
        return await ParseNetwork.loadImage(requestParams, cacheKey);
    }


    public static async getSectionsForSchool(school: ParseSchool): Promise<ParseSection[]> {
        let jsonResult = [];
        const schoolCondition = {
            'school': ParseNetwork.createPointer('School', school.objectId)
        };

        const requestParams: RequestParams = {
            url: SECTION_URL,
            queryParams: schoolCondition,
            isWhereQuery: true
        };
        jsonResult = await ParseNetwork.get(requestParams, SECTIONS);
        const sections: ParseSection[] = ParseApi.fromJson(jsonResult, ParseSection);
        await ParseApi.asyncForEach(sections, async (section) => {
            await ParseApi.loadImage(section.image.url, section.name);
            const cachedBase64 = ParseApi.loadCachedImage(section.name);
            cc.log('cached base64 for section:', section.name, cachedBase64)
        })
        return sections;
    }

    public static cachedSections(): [ParseSection] {
        return ParseApi.fromJson(ParseNetwork.getFromCache(SECTIONS), ParseSection);
    }

    public static async getStudentsForSection(schoolId: string, sectionId: string): Promise<ParseStudent[]> {
        let jsonResult = [];
        const requestParams: RequestParams = {
            url: STUDENT_URL,
            queryParams: {
                'school': ParseNetwork.createPointer('School', schoolId),
                'section': ParseNetwork.createPointer('Section', sectionId)
            },
            isWhereQuery: true
        };
        jsonResult = await ParseNetwork.get(requestParams, STUDENTS);
        const students: ParseStudent[] = ParseApi.fromJson(jsonResult, ParseStudent);
        await ParseApi.asyncForEach(students, async (student) => {
            await ParseApi.loadImage(student.image.url, student.name);
            const cachedBase64 = ParseApi.loadCachedImage(student.name);
            cc.log('cached base64 for student:', student.name, cachedBase64)
        })

        return students;

    }

    public static cachedStudents(): [ParseStudent] {
        return ParseApi.fromJson(ParseNetwork.getFromCache(STUDENTS), ParseStudent);
    }

    private static fromJson<T>(payload: Object, ctor: { new(): T }): any {
        let result: T | T[] = null;
        if (Array.isArray(payload)) {
            result = payload.map(p => {
                    let s: T = new ctor();
                    return Object.assign(s, p);
                }
            )
        } else {
            let s: T = new ctor();
            result = Object.assign(s, payload);
        }
        return result;
    }

    public static async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

}