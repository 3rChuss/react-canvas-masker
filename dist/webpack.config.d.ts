export const entry: string;
export namespace output {
    const path: string;
    const filename: string;
    namespace library {
        const type: string;
        const name: string;
    }
}
export namespace resolve {
    const extensions: string[];
    const modules: string[];
}
export const externals: string[];
export namespace module {
    const rules: ({
        test: RegExp;
        exclude: RegExp[];
        use: {
            loader: string;
        }[];
        type?: undefined;
    } | {
        test: RegExp;
        use: ({
            loader: string;
            options?: undefined;
        } | {
            loader: string;
            options: {
                lessOptions: {
                    javascriptEnabled: boolean;
                };
            };
        })[];
        exclude?: undefined;
        type?: undefined;
    } | {
        test: RegExp;
        type: string;
        exclude?: undefined;
        use?: undefined;
    })[];
}
export const plugins: any[];
