import {ParseNetwork, RequestOptions, RequestParams, RequestResult} from './services/ParseNetwork';
import {LOGGED_IN_USER, LOGIN_URL, PASSWORD, SCHOOL_URL, USERNAME} from './constants';
import {ParseApi} from './services/parseApi';
import {ParseSection} from "./domain/parseSection";
import {ParseLoggedInUser} from "./domain/parseLoggedInUser";
import {ParseSchool} from "./domain/parseSchool";
import {ParseStudent} from "./domain/parseStudent";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    async start() {
        // init logic
        this.label.string = this.text;

        // login
        await ParseApi.login(USERNAME, PASSWORD);
        const loggedInUser: ParseLoggedInUser = ParseApi.getLoggedInUser();
        console.log(loggedInUser);

        // get school by code
        await ParseApi.getSchoolByCode('test1');
        const selectedSchool: ParseSchool[] = ParseApi.selectedSchool();
        console.log(selectedSchool);

        // get all section in school
        await ParseApi.getSectionsForSchool();
        const sections: ParseSection[] = await ParseApi.cachedSections();
        console.log(sections);

        // get student in section, school
        await ParseApi.getStudentsForSection('aseQeuj1fJ');
        const students: ParseStudent[] = ParseApi.cachedStudents();
        console.log(students);

    }
}
