export class NodeData{
    NodePrecent:number[];

    constructor(json:any){
        if(json.hasOwnProperty('node_precent')){
            let _p = json.node_precent as Array<number>;
            this.NodePrecent = _p;
            console.log("Length : " + this.NodePrecent);
        }
    }
}