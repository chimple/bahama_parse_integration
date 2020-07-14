import {ParseNetwork, RequestOptions, RequestParams} from './ParseNetwork';
import {
    CURRENT_SELECTED_SCHOOL,
    LOGGED_IN_USER,
    LOGIN_URL,
    SCHOOL_URL,
    SECTION_URL,
    SECTIONS, STUDENT_URL, STUDENTS
} from '../constants';
import {ParseLoggedInUser} from '../domain/parseLoggedInUser';
import {ParseSchool} from '../domain/parseSchool';
import {ParseSection} from "../domain/parseSection";
import {ParseStudent} from "../domain/parseStudent";

export class ParseApi {
    public static async login(username: string, password: string): Promise<ParseLoggedInUser> {
        const requestParams: RequestParams = {
            url: LOGIN_URL,
            queryParams: {username, password}
        };
        const jsonResult = await ParseNetwork.get(requestParams, LOGGED_IN_USER);
        return ParseApi.fromJson(jsonResult, ParseLoggedInUser);
    }

    public static getLoggedInUser(): ParseLoggedInUser {
        return ParseApi.fromJson(ParseNetwork.getFromCache(LOGGED_IN_USER), ParseLoggedInUser);
    }

    public static selectedSchool(): [ParseSchool] {
        return ParseApi.fromJson(ParseNetwork.getFromCache(CURRENT_SELECTED_SCHOOL), ParseSchool);
    }


    public static async getSchoolByCode(code: string): Promise<ParseSchool[]> {
        const requestParams: RequestParams = {
            url: SCHOOL_URL,
            queryParams: {
                code
            },
            isWhereQuery: true
        };
        const jsonResult = await ParseNetwork.get(requestParams, CURRENT_SELECTED_SCHOOL);
        return ParseApi.fromJson(jsonResult, ParseSchool);
    }

    public static async getSectionsForSchool(): Promise<ParseSection[]> {
        let jsonResult = [];
        const selectedSchools: ParseSchool[] = ParseApi.selectedSchool();
        if (selectedSchools && selectedSchools.length > 0) {
            const selectedSchool = selectedSchools[0];
            const schoolCondition = {
                'school': ParseNetwork.createPointer('School', selectedSchool.objectId)
            };

            const requestParams: RequestParams = {
                url: SECTION_URL,
                queryParams: schoolCondition,
                isWhereQuery: true
            };
            jsonResult = await ParseNetwork.get(requestParams, SECTIONS);
            return ParseApi.fromJson(jsonResult, ParseSection);
        }
        return jsonResult;
    }

    public static cachedSections(): [ParseSection] {
        return ParseApi.fromJson(ParseNetwork.getFromCache(SECTIONS), ParseSection);
    }

    public static async getStudentsForSection(sectionId: string): Promise<ParseStudent[]> {
        let jsonResult = [];
        const selectedSchools: ParseSchool[] = ParseApi.selectedSchool();
        if (selectedSchools && selectedSchools.length > 0) {
            const selectedSchool = selectedSchools[0];

            const requestParams: RequestParams = {
                url: STUDENT_URL,
                queryParams: {
                    'school': ParseNetwork.createPointer('School', selectedSchool.objectId),
                    'section': ParseNetwork.createPointer('Section', sectionId)
                },
                isWhereQuery: true
            };
            jsonResult = await ParseNetwork.get(requestParams, STUDENTS);
            return ParseApi.fromJson(jsonResult, ParseSection);
        }
        return jsonResult;
    }

    public static cachedStudents(): [ParseStudent] {
        return ParseApi.fromJson(ParseNetwork.getFromCache(STUDENTS), ParseStudent);
    }


    public static fromJson<T>(payload: Object, ctor: { new(): T }): any {
        let result: T | T[] = null;
        let s: T = new ctor();
        if (Array.isArray(payload)) {
            result = payload.map(p => Object.assign(s, p))
        } else {
            result = Object.assign(s, payload);
        }
        return result;
    }
}