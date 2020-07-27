import {ParseNetwork, RequestOptions, RequestParams, RequestResult} from './services/ParseNetwork';
import {LOGGED_IN_USER, LOGIN_URL, PASSWORD, SCHOOL_URL, USERNAME} from './constants';
import {ParseApi} from './services/parseApi';
import {ParseSection} from "./domain/parseSection";
import {ParseLoggedInUser} from "./domain/parseLoggedInUser";
import {ParseSchool} from "./domain/parseSchool";
import {ParseStudent} from "./domain/parseStudent";
import {ParseConnection} from "./domain/parseConnection";

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
        const loggedInUser: ParseLoggedInUser = await ParseApi.login(USERNAME, PASSWORD);
        cc.log('loggedInUser', JSON.stringify(loggedInUser));

        // connection
        const connections: ParseConnection[] = await ParseApi.connections();
        await ParseApi.asyncForEach(connections, async (connection) => {
            const school: ParseSchool = connection.school;
            cc.log('got school', school.name + " " + school.objectId);
            const sections: ParseSection[] = await ParseApi.getSectionsForSchool(school);
            await ParseApi.asyncForEach(sections, async (section) => {
                cc.log('got section:' + section.name + " " + section.objectId);
                const students: ParseStudent[] = await ParseApi.getStudentsForSection(school.objectId, section.objectId);
                cc.log('students for section:', section.objectId);
                students.forEach(s => cc.log(JSON.stringify(s)))
            })
        })


        // await ParseApi.loadImage(
        //     'https://parsefiles.back4app.com/x45P2SW2h1UfyDT8F0C9vpKmOGe7eFCnIo33Q2dk/a0a28307880beba9117e0dcd2c0dbe97_image_picker1653678166918455248.jpg',
        //     'IMG_1'
        // );
        //
        // const cachedBase64 = ParseApi.loadCachedImage('IMG_1');
        // cc.log('cachedBase64', cachedBase64);
    }
}
